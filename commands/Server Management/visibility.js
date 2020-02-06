module.exports = {
	help: ()=> "Set wether a server can be seen on the website or not",
	usage: ()=> [" [serverID] [(true|1) | (false|0)] - Sets a server's visibility for the website"],
	desc: ()=> "**This is not currently necessary to do**",
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a server ID and a value to set visibility to");

		var guild = await bot.utils.getServer(bot, args[0]);
		if(!guild) return msg.channel.createMessage("Server not found");

		var scc;
		if(["true", "1"].includes(args[1])) scc = await bot.utils.updateHostedServer(bot, msg.guild.id, guild.server_id, {visibility: true});
		else scc = await bot.utils.updateHostedServer(bot, msg.guild.id, guild.server_id, {visibility: false});

		if(scc) msg.channel.createMessage("Visibility set!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	alias: ["vis"],
	permissions: ["manageMessages"]
}