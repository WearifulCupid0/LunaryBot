const { Permissions, Client, Collection, Constants: { InviteScopes } } = require("discord.js")
const ClusterClient = require("./system/cluster/ClusterClient")
const ShardManager = require("./system/cluster/ShardManager")
const Logger = require("./utils/logger")
require("./functions/shorten")
const moment = require("moment")
require("moment-duration-format")
const firebase = require("firebase")
const Command = require("./structures/Command")
const Event = require("./structures/Event")
const Language = require("./languages/Language")
global.emojis = require("./utils/emojisInstance")

class Lunary extends Client {
    constructor() {
        super({
            shards: ClusterClient.getinfo().SHARD_LIST,
            shardCount: ClusterClient.getinfo().TOTAL_SHARDS,
            intents: 1719,
            ws: {
                properties: { 
                    $browser: "Discord iOS" 
                },
            }, 
            fetchAllMembers: true
        })
        this.config = require("./config/config")
        this.cluster = new ClusterClient(this)
        this.shard = new ShardManager(this)
        this.logger = new Logger(this.cluster)

        firebase.initializeApp(this.config.firebaseConfigGuilds)
        this.GuildsDB = firebase.database()
        this.db = this.GuildsDB

        const UsersDB = firebase.initializeApp(this.config.firebaseConfigUsers, "users")
        this.UsersDB = UsersDB.database()
        
        const LogsDB = firebase.initializeApp(this.config.firebaseConfigLogs, "logs")
        this.LogsDB = LogsDB.database()

        this.mutes = new Collection()
        
        this.on("shardReconnecting", shard => {
            console.log(shard)
            this.logger.log(`Client reconectado ao Discord!`, { key: "Client", cluster: true, date: true })
        })
    }

    init() {
        this.loadLanguage()
        this.loadEvents()
        this.loadCommands()
        this.login(this.config.token)
    }

    /**
     * 
     * @returns {Language[]}
     */
    loadLanguage() {
        this.langs = []
        require("./handlers/langHandler")(this)
        return this.langs
    }

    /**
     * 
     * @returns {Event[]}
     */
    loadEvents() {
        this.events = []
        require("./handlers/eventHandler")(this)
        return this.events
    }

    /**
     * 
     * @returns {Command[]{}}
     */
    loadCommands() {
        this.commands = {}
        require("./handlers/commandHandler")(this)
        return this.commands
    }

    /**
    * @param {{
    *   client_id:string,
    *   scopes:string[],
    *   permissions:bigint,
    *   disableGuildSelect:boolean,
    *   guild:string,
    *   redirect:string,
    *   redirect_uri:string,
    *   state:string
    * }} options
    */
     generateOauth2(options = {}) {
        if(typeof options !== 'object') throw new TypeError('INVALID_TYPE', 'options', 'object', true);
        let client_id = options.client_id
        
        if(!client_id) {
            if(!this.application) throw new Error('CLIENT_NOT_READY', 'generate an invite link');
            else client_id = this.application.id
        }
    
        const query = new URLSearchParams({
            client_id: client_id,
        });
    
        const { scopes } = options;
        if(typeof scopes === 'undefined') throw new TypeError('INVITE_MISSING_SCOPES');
        
        if(!Array.isArray(scopes)) throw new TypeError('INVALID_TYPE', 'scopes', 'Array of Invite Scopes', true);
        
        if(!scopes.some(scope => ['bot', 'applications.commands'].includes(scope))) throw new TypeError('INVITE_MISSING_SCOPES');
        
        const invalidScope = scopes.find(scope => !InviteScopes.includes(scope));
        if(invalidScope) throw new TypeError('INVALID_ELEMENT', 'Array', 'scopes', invalidScope);

        query.set('scope', scopes.join(' '));
    
        if(options.permissions) {
            const permissions = Permissions.resolve(options.permissions);
            if(permissions) query.set('permissions', permissions);
        }
    
        if(options.disableGuildSelect) query.set('disable_guild_select', true)
    
        if(options.guild) {
            const guildId = this.guilds.resolveId(options.guild);
            if(!guildId) throw new TypeError('INVALID_TYPE', 'options.guild', 'GuildResolvable');
            query.set('guild_id', guildId);
        }

        if(options.redirect_uri || options.redirect) query.set('redirect_uri', options.redirect_uri || options.redirect)
        if(options.state) query.set('state', options.state)
    
        return `${this.options.http.api}${this.api.oauth2.authorize}?${query.toString()}`;
    }
}

const client = new Lunary()

module.exports = client

process.on('warning', () => console.log("Erro!"));
require("./structures/server/main")()
client.init()