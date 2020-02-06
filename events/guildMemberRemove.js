module.exports = async (guild, member, bot) => {
	//also update member count
	await bot.utils.updatePostsByServer(bot, guild.id)
}