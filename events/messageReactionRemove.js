module.exports = async (msg, emoji, user, bot) => {
	if(bot.user.id == user) return;

	var cfg = await bot.utils.getConfig(bot, msg.channel.guild.id);
	if(cfg && cfg.blacklist && cfg.blacklist.includes(user)) return;

	var em;
	if(emoji.id) em = `:${emoji.name}:${emoji.id}`;
	else em = emoji.name;

	try {
		var message = await bot.getMessage(msg.channel.id, msg.id);
		await bot.utils.updateStarPost(bot, msg.channel.guild.id, msg.id, {emoji: em, count: message.reactions[em.replace(/^:/,"")] ? message.reactions[em.replace(/^:/,"")].count : 0})
	} catch(e) {
		console.log("Error attempting to get message/update starboard post:\n"+e.stack);
	}
}