module.exports = {
	help: ()=> "Sets the name of a server.",
	usage: ()=> [" [id] [name] - Sets name of server that has the given ID"],
	execute: async (bot, msg, args)=> {
		var exists = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(exists && exists=="ERR") return msg.channel.createMessage('Something went wrong');
		if(!exists) return msg.channel.createMessage('Server not found.');

		var res = await bot.utils.updateHostedServer(bot, msg.guild.id, args[0], {name: args.slice(1).join(" ")});
		var res2 = await bot.utils.updatePosts(bot, msg.guild.id, args[0]);
		if(res && res2) {
			msg.channel.createMessage('Name updated!');
		} else if(!res) {
			msg.channel.createMessage('Something went wrong while updating the server');
		} else if(res && !res2) {
			msg.channel.createMessage('Something went wrong while updating posts')
		} else {
			msg.channel.createMessage('Something went wrong')
		}
	},
	permissions: ["manageMessages"],
	guildOnly: true
}