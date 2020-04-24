module.exports = {
	help: ()=> "Set wether a server can be seen on the website or not",
	usage: ()=> [" [serverID] [(true|1) | (false|0)] - Sets a server's visibility for the website"],
	desc: ()=> "**This is not currently necessary to do**",
	execute: async (bot, msg, args) => {
		var guild = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!guild) return "Server not found!";

		if(!args[1]) return `Current state: ${guild.visibility ? "Visibile" : "Not visible"}`;

		try {
			switch(args[1].toLowerCase()) {
				case "true":
				case "1":
					guild = await bot.stores.servers.update(msg.guild.id, guild.server_id, {visibility: true});
					break;
				case "false":
				case "0":
					guild = await bot.stores.servers.update(msg.guild.id, guild.server_id, {visibility: false});
					break;
				default:
					return "That value is invalid";
					break;
			}
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, guild.server_id, guild);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Visibility set!";
	},
	guildOnly: true,
	alias: ["vis"],
	permissions: ["manageMessages"]
}