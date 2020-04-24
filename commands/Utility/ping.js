module.exports = {
	help: ()=> "Pings contacts of a server",
	usage: ()=> [" [id] - Pings contacts of server with given ID"],
	execute: async (bot, msg, args) => {
		let guild = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!guild) return "That server does not exist!";
		if(!guild.contact_id || !guild.contact_id[0]) return "That guild has no contacts registered!";

		var dat = await bot.utils.verifyUsers(bot, guild.contact_id);
		return 'Ping! '+dat.info.map(m => m.mention).join(" ")
	},
	permissions: ["manageMessages"],
	guildOnly: true
}