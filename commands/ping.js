module.exports = {
	help: ()=> "Pings contacts of a server",
	usage: ()=> [" [id] - Pings contacts of server with given ID"],
	execute: async (bot, msg, args) => {
		let guild = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(!guild) return msg.channel.createMessage("That server does not exist.");

		var dat = await bot.utils.verifyUsers(bot, guild.contact_id.split(" "));
		msg.channel.createMessage('Ping! '+dat.info.map(m => m.mention).join(" "));
	},
	permissions: ["manageMessages"]
}