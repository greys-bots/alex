module.exports = async (guild, bot) => {
	try {
		var data = await bot.utils.getExportData(bot, guild.id);
		var ch = await bot.getDMChannel(guild.ownerID);
		if(!ch) return;
		ch.createMessage(["Hi! I'm sending you this because you removed me from your server. ",
			"After 24 hours, all the data I have indexed for it will be deleted. ",
			"If you invite me back after 24 hours are up and would like to start up ",
			"where you left off, you can use this file to do so:"].join(""));
	} catch(e) {
		console.log("Error attempting to export/deliver data after being kicked:\n"+e.stack)
	}
}