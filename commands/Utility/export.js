module.exports = {
	help: ()=> "Export your server's data, to be imported in case something happens",
	usage: ()=> [" - Gives you a file of your server's data"],
	execute: async (bot, msg, args) => {
		await msg.addReaction("⌛");
		var data = await bot.utils.getExportData(bot, msg.guild.id);

		var ch = await bot.getDMChannel(msg.author.id);
		if(!ch) return msg.channel.createMessage("Can't get your DM channel :(");
		else {
			try {
				ch.createMessage("Here you go!",[{file: Buffer.from(JSON.stringify(data)), name: "hub_data.json"}]);
			} catch(e) {
				console.log(e.stack);
				msg.channel.createMessage("DM failed!")
			}
		}

		await msg.removeReaction("⌛");
	},
	permissions: ["manageGuild"],
	guildOnly: true
}