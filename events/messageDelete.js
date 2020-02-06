module.exports = async (msg, bot) => {
	if(!msg.channel.guild) return;
	try {
		bot.db.query(`DELETE FROM reactposts WHERE server_id=? AND channel_id=? AND message_id=?`,[msg.channel.guild.id, msg.channel.id, msg.id]);
		await bot.utils.deleteTicketPost(bot, msg.channel.guild.id, msg.channel.id, msg.id);
		await bot.utils.deletePost(bot, msg.channel.guild.id, msg.id);

		var log
		log = await bot.utils.getRawBanLogByMessage(bot, msg.channel.guild.id, msg.channel.id, msg.id);
		if(log) await bot.utils.deleteBanLog(bot, log.hid, msg.channel.guild.id);

		log = await bot.utils.getRawListingLogByMessage(bot, msg.channel.guild.id, msg.channel.id, msg.id);
		if(log) await bot.utils.deleteListingLog(bot, log.hid, msg.channel.guild.id);
	} catch(e) {
		console.log("Error deleting a log:\n"+e.stack);
	}
}