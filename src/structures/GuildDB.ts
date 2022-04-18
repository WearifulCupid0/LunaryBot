import DatabasesManager from './DatabasesManager';
import Locale from './Locale';
import BitField, { TBit } from '../utils/BitField';
import { Guild, Member, TextableChannel } from 'eris';
import { TGuildConfigs, TLunarPermissions } from '../utils/Constants';
import { v4 } from 'uuid';

interface IGuildDataBase {
    configs?: number;
    locale?: string;
    modlogs_channel?: string;
    punishment_channel?: string;
    permissions?: { [key: string]: number };
    punishment_message?: string;
    reasons?: IReason[];
    premium_type?: number;
    premium_started?: number;
    premium_duration?: number;
}

interface IReason {
    text: string;
    type: 1 | 2 | 3 | 4;
    duration?: number;
    keys?: string[];
    days?: number;
    _id: string;
}

class GuildDB {
    public declare guild: Guild;
    public declare dbmanager: DatabasesManager;
    public declare data: IGuildDataBase;
    public configs: Configs;
    public locale: Locale;
    public modlogsChannel: TextableChannel | null;
    public punishmentChannel: TextableChannel | null;
    public permissions: Map<string, LunarPermissions>;
    public punishmentMessage: Object | null;
    public reasons: IReason[];
    public premiumType: number | null;
    public premiumStarted: number | null;
    public premiumDuration: number| null;
    public premiumExpire: number | null;

    constructor(guild: Guild, data: IGuildDataBase = {}, dbmanager: DatabasesManager) {
        Object.defineProperty(this, 'guild', { value: guild, enumerable: false });
        Object.defineProperty(this, 'dbmanager', { value: dbmanager, enumerable: false });
        Object.defineProperty(this, 'data', { value: data, enumerable: false });

        this.configs = new Configs(data.configs || 0);

        this.locale = ((data.locale ? this.dbmanager.client.locales.find(l => l.name == data.locale) : false) || this.dbmanager.client.locales.find(l => l.name == this.dbmanager.client.config.defaultLocale)) as Locale;

        this.modlogsChannel = (data.modlogs_channel ? guild.channels.get(data.modlogs_channel) as TextableChannel : null) ?? null;
        this.punishmentChannel = (data.punishment_channel ? guild.channels.get(data.punishment_channel) as TextableChannel : null) ?? null;
        
        this.permissions = new Map();
        for (const [key, value] of Object.entries(data.permissions || {})) {
            this.permissions.set(key, new LunarPermissions(value));
        }
        
        this.punishmentMessage = null;

		if(data.punishment_message) {
			try {
				this.punishmentMessage = JSON.parse(data.punishment_message);
			} catch(_) {
				this.punishmentMessage = null;
			}
		}

        this.reasons = ([ ...(data.reasons || []) ]).map(reason => {
            reason._id = v4();
            return reason;
        });

        const premium_expire = data.premium_duration && data.premium_started ? data.premium_started + Number(data.premium_duration) : 0;

        this.premiumType = (premium_expire > Date.now() ? data.premium_type : null) || null;
		this.premiumStarted = (premium_expire > Date.now() ? data.premium_started : null) || null;
		this.premiumDuration = (premium_expire > Date.now() ? Number(data.premium_duration) : null) || null;
		this.premiumExpire = premium_expire || null;
    }

    public hasPremium(): boolean {
        return (this.premiumExpire && !!(this.premiumExpire > Date.now())) || false;
    }

    public getMemberLunarPermissions(member: Member): LunarPermissions {
        const permissions = new LunarPermissions();

        member.roles.map(role => {
            const p = this.permissions.get(role);
            if (p) permissions.add(p);
        });

        return permissions
    }
}

class Configs extends BitField {
    constructor(bits: TBit) {
        super(bits, {
            FLAGS: Configs.FLAGS,
            defaultBit: 0,
        })

        this.has = (bit: TGuildConfigs | Array<TGuildConfigs>) => {
            return super.has.bind(this)(bit)
        };
    }

    static get FLAGS() {
		return {
            mandatoryReason: 1 << 0,
            sendTranscript: 1 << 1,
        } as { [key in TGuildConfigs]: number };
	}
}

class LunarPermissions extends BitField {
    public has: (bit: TLunarPermissions | Array<TLunarPermissions>) => boolean;
    
    constructor(bits?: TBit) {
        super(bits, {
            FLAGS: LunarPermissions.FLAGS,
            defaultBit: 0,
        })

        this.has = (bit: TLunarPermissions | Array<TLunarPermissions>) => {
            return super.has.bind(this)(bit)
        };
    }

    static get FLAGS() {
		return {
            lunarBanMembers: 1 << 0,
            lunarKickMembers: 1 << 1,
            lunarMuteMembers: 1 << 2,
            lunarAdvMembers: 1 << 3,
            lunarPunishmentOutReason: 1 << 4,
            lunarViewHistory: 1 << 5,
            lunarManageHistory: 1 << 6,
        } as { [key in TLunarPermissions]: number }
	}
}

export default GuildDB;

export { Configs, LunarPermissions };