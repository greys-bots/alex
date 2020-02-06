module.exports = async (guild, oldGuild, bot) => {
	var posts = await bot.utils.getPostsByServer(bot, guild.id);
	if(!posts) return;

	for(var i = 0; i < posts.length; i++) {
		var message;
		try {
			message = await bot.getMessage(posts[i].channel_id, posts[i].message_id)
		} catch(e) {
			console.log(e);
			continue;
		}

		var em = message.embeds[0];
		em.title = guild.name;
		em.thumbnail = {url: guild.iconURL};
		bot.editMessage(message.channel.id, message.id, {embed: em})
		bot.utils.updateServer(bot, guild.id, {name: guild.name, pic_url: guild.iconURL})
	}
}