module.exports = {
	help: ()=> "Finds all servers matching a certain name.",
	usage: ()=> [" [name] - Finds every server that has the input in the name"],
	execute: async (bot, msg, args)=>{
		var name = args.join(" ").toLowerCase();
		var servers = await bot.stores.servers.find(msg.guild.id, name);
		if(!servers || !servers[0]) return "No servers were found";

		var embeds = [];
		for(var i = 0; i < servers.length; i++) {
			var contacts;
			if(!servers[i].contact_id || !servers[i].contact_id[0]) contacts = "(no contact provided)";
			else {
				var dat = await bot.utils.verifyUsers(bot, servers[i].contact_id);
				contacts = dat.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n");
			}
			
			embeds.push({embed: {
				title: (servers[i].name || "(unnamed)") + ` (server ${i+1}/${servers.length})`,
				description: servers[i].description || "(no description provided)",
				fields: [
					{name: "Contact", value: contacts},
					{name: "Link", value: servers[i].invite ? servers[i].invite : "(no link provided)"},
					{name: "Members", value: servers[i].guild ? servers[i].guild.memberCount : "(unavailable)"}
				],
				thumbnail: {
					url: servers[i].pic_url || ""
				},
				color: 3447003,
				footer: {
					text: `ID: ${servers[i].server_id} | This server ${servers[i].visibility ? "is" : "is not"} visible on the website`
				}
			}})
		}

		return embeds;
	},
	alias: ['servers', 'server'],
	permissions: ["manageMessages"],
	guildOnly: true
}