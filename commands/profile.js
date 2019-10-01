module.exports = {
	help: ()=> "Checks what servers a user owns or mods for",
	usage: ()=> [" [id] - Checks what servers a user owns or mods for"],
	execute: async (bot, msg, args)=> {
		var id = (msg.mentions.length > 0 ? msg.mentions[0].id : args[0])
		var guilds = await bot.utils.getServersWithContact(bot, msg.guild.id, id);
		if(guilds[0]) {
			var member = await bot.getRESTUser(id);
			msg.channel.createMessage({embed: {
				title: member.username+"#"+member.discriminator,
				description: "Servers this user is listed as a contact for: (name, ID)",
				fields: guilds.map(g => {
					return {name: g.name, value: g.server_id}
				})
			}})
		} else {
			console.log(guilds)
			msg.channel.createMessage('User is not a contact for any servers.');
		}
	},
	alias: ["prof", "p"]
}