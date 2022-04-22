import Command, { SubCommand, LunarClient, IContextInteractionCommand } from '../../../../structures/Command';
import Eris from 'eris';
import InteractionCollector from '../../../../utils/collector/Interaction';
import { ILog } from '../../../../@types/types';
import ModUtils from '../../../../utils/ModUtils';

class KickUserSubCommand extends SubCommand {
    constructor(client: LunarClient, mainCommand: Command) {
        super(client, {
            name: 'user',
            dirname: __dirname,
            permissions: {
                me: ['kickMembers'],
                bot: ['lunarKickMembers'],
                discord: ['kickMembers'],
            },
            guildOnly: true,
            cooldown: 3,
        }, mainCommand);
    }

    public async run(context: IContextInteractionCommand) {
        await context.interaction.acknowledge();
        
        const member: Eris.Member = context.options.get('user', { member: true });
        const user = member?.user || context.options.get('user');
        
        if(!member) {
            return context.interaction.createFollowup({
                content: context.t('general:invalidUser', {
                    reference: user.id,
                }),
            }).catch(() => {});
        }

        if(!this.Utils.highestPosition(context.member, member)) {
            return context.interaction.createFollowup({
                content: context.t('general:userMissingPermissionsToPunish')
            }).catch(() => {});
        }

        if(!this.Utils.highestPosition(context.guild.members.get(this.client.user.id) as Eris.Member, member)) {
            return context.interaction.createFollowup({
                content: context.t('general:lunyMissingPermissionsToPunish')
            }).catch(() => {});
        }

        let { reason, replyMessageFn = context.interaction.createFollowup.bind(context.interaction) } = await ModUtils.punishmentReason.bind(this)(context, 2);

        if (reason === false) {
            return;
        }

        if(typeof reason == 'object') {
            reason = reason.text;
        }

        const ready = async(replyMessageFn: (content: Eris.InteractionEditContent, ...args: any[]) => Promise<any>) => {
            let notifyDM = true;

            try {
                if(context.options.get('notify-dm') != false) await (await user.getDMChannel()).createMessage({
                    content: context.t('kick:default_dm_message', {
                        emoji: ':hiking_boot:',
                        guild_name: context.guild.name,
                        reason
                    }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    // @ts-ignore
                                    label: `${context.t('general:sentFrom')} ${context.guild.name}`.shorten(80),
                                    custom_id: 'sentFrom',
                                    style: Eris.Constants.ButtonStyles.SECONDARY,
                                    disabled: true,
                                }
                            ]
                        }
                    ]
                })
            } catch(_) {
                notifyDM = false
            };

            await context.guild.kickMember(user.id, context.t('general:punishedBy', {
                author_tag: `${context.user.username}#${context.user.discriminator}`,
                reason
                })
                // @ts-ignore
                .shorten(512)
            )

            const logData = {
                reason,
                server: context.guild.id,
                author: context.user.id,
                type: 2,
                date: Date.now(),
                user: user.id,
            } as ILog

            const log = Buffer.from(
				JSON.stringify(logData),
				'ascii',
			).toString('base64');

            let logs = await this.client.dbs.getLogs();

            const id = await ModUtils.generatePunishmentID.bind(this)(logs);

            this.client.dbs.setLogs({
                [id]: log,
                cases: this.client.cases + 1,
            });

            const { punishmentChannel } = context.dbs.guild;

            if(punishmentChannel) {
                const { content, files } = await ModUtils.punishmentMessage.bind(this)({
                    author: context.user,
                    user,
                    reason: reason as string,
                    duration: context.t('general:permanent'),
                    type: context.t('kick:punishmentType'),
                }, context.t, context.dbs.guild, context.channel);

                punishmentChannel.createMessage(content, files).catch(() => {});
            }

            let xp = context.dbs.user.xp;
            let leveluped = false;

            if(!member) {
				const { xp: _xp, leveluped: _leveluped } = ModUtils.generatePunishmentXP.bind(this)(context, user, reason as string, 2, logs, 31);

                context.dbs.user.xp = _xp;

                leveluped = _leveluped;
                xp = _xp;
			}

            context.dbs.user.lastPunishmentAppliedId = id;

            context.dbs.user.save();

            await replyMessageFn({
                content: context.t('general:successfullyPunished', {
                    author_mention: context.user.mention,
                    user_mention: user.mention,
                    user_tag: `${user.username}#${user.discriminator}`,
                    user_id: user.id,
                    id: '#' + id,
                    notifyDM: !notifyDM ? context.t('general:notNotifyDm') : '.'
                }),
                embeds: [],
				components: [],
            });

            if(leveluped) {
                context.interaction.createFollowup({
                    content: context.t('general:levelUP', {
                        level: this.Utils.calculateLevels(xp).current.level,
                        user: context.user.mention,
                    }),
                    flags: Eris.Constants.MessageFlags.EPHEMERAL,
                });
            }

            return;
        };

        return ModUtils.confirmPunishment.bind(this)(context, user, ready.bind(this), replyMessageFn);
    }
}

export default KickUserSubCommand;