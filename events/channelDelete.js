module.exports = async (channel, bot) => {
	try {
		await bot.utils.deleteSupportTicket(bot, channel.guild.id, channel.id);
	} catch(e) {
		console.log("Error deleting support ticket:\n"+e.stack)
	}
}