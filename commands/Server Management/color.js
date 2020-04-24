module.exports = {
	help: ()=> "Sets the color for a listing",
	usage: ()=> [" [serverID] [color] - Sets the listing's color"],
	execute: async (bot, msg, args) => {
		let guild = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!guild) return "That server does not exist";

		var color = bot.tc(args.slice(1).join(""));
		if(!color.isValid()) return "That color isn't valid!";

		try {
			guild = await bot.stores.servers.update(msg.guild.id, args[0], {color: color.toHex()});
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, args[0], guild);
		} catch(e) {
			console.log(e);
			return "ERR: "+(e.message || e);
		}

		return "Color updated!";
	},
	alias: ["colour", "col"],
	permissions: ["manageMessages"],
	guildOnly: true
}