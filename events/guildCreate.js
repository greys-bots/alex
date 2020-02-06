module.exports = async (guild, bot) => {
	var posts = await bot.utils.getPostsByServer(bot, guild.id);
	if(!posts) return;

	console.log("posts exist")
	for(var i = 0; i < posts.length; i++) {
		var message = await bot.getMessage(posts[i].channel_id, posts[i].message_id)
		if(!message) continue;
		var em = message.embeds[0];
		em.fields[2].value = guild.memberCount;
		await bot.editMessage(message.channel.id, message.id, {embed: em})
	}
}