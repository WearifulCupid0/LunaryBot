const { MessageEmbed } = require("discord.js")
const { format } = require("./format_time")
const p = {
    ban: {
        cor: "RED",
        text: "Ban"
    },
    kick: {
        cor: "#ea8935",
        text: "Kick"
    },
    mute: {
        cor: "#4b8cd2",
        text: "Mute"
    },
    adv: {
        cor: 15379509,
        text: "Warn"
    },
    unmute: {
        cor: "GREEN",
        text: "uNMUTE"
    }
}

module.exports = function message_modlogs(author, user, reason, type, t, id, time) {
    const embed = new MessageEmbed()
    .setColor(p[type].cor)
    .setThumbnail(author.displayAvatarURL({ dynamic: true, format: "png" }))
    .setAuthor(`${p[type].text} | ${user.tag}`, user.displayAvatarURL({ dynamic: true, format: "png" }))
    .setDescription(`> ${global.emojis.get("author").mention} **${t("default_message_modlog/author")}:** ${author.toString()} (\`${author.id}\`)\n> ${global.emojis.get("user").mention} **${t("default_message_modlog/user")}:** ${user.toString()} (\`${user.id}\`)`)
    .addField(`${global.emojis.get("clipboard").mention} ${t("default_message_modlog/reason")}:`, `>>> ${reason.shorten(1010)}`, false)
    .setFooter("ID: " + id)
    .setTimestamp()

    if(time) embed.addField(`${global.emojis.get("time").mention} • ${t("geral/duration")}:`, `> \`${time != "..." ? `${format(time)}` : t("geral/not_determined")}\``)

    return embed
}