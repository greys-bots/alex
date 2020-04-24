module.exports = {
	help: ()=> "Checks what servers a user owns or mods for",
	usage: ()=> [" [id] - Checks what servers a user owns or mods for"],
	execute: async (bot, msg, args)=> {
		var id = args[0].replace(/[<@!>]/g, "");
		var guilds = await bot.stores.servers.getWithContact(msg.guild.id, id);
		if(guilds && guilds[0]) {
			var user = bot.users.find(u => u.id == id);
			if(!user) user = await bot.getRESTUser(id);
			return {embed: {
				title: user.username+"#"+user.discriminator,
				description: "Servers this user is listed as a contact for: (name, ID)",
				fields: guilds.map(g => {
					return {name: g.name, value: g.server_id}
				})
			}};
		} else return 'User is not a contact for any servers';
	},
	alias: ["prof", "p"],
	guildOnly: true
}