module.exports = {
	help: ()=> "Export your server's data, to be imported in case something happens",
	usage: ()=> [" - Gives you a file of your server's data"],
	execute: async (bot, msg, args) => {
		await msg.addReaction("⌛");
		var data = await bot.utils.getExportData(bot, msg.guild.id);

		var ch = await bot.getDMChannel(msg.author.id);
		if(!ch) return "Can't get your DM channel :(";
		else {
			try {
				ch.createMessage("Here you go!",[{file: Buffer.from(JSON.stringify(data)), name: "hub_data.json"}]);
			} catch(e) {
				console.log(e);
				return "ERR: "+e.message;
			}
		}

		await msg.removeReaction("⌛");
		return;
	},
	permissions: ["manageGuild"],
	guildOnly: true
}