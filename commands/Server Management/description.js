module.exports = {
	help: ()=> "Sets the description of a server.",
	usage: ()=> [" [id] [description] - Sets description of server that has the given ID"],
	execute: async (bot, msg, args)=> {
		var exists = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(exists && exists=="ERR") return msg.channel.createMessage('Something went wrong');
		if(!exists) return msg.channel.createMessage('Server not found.');

		var res = await bot.utils.updateHostedServer(bot, msg.guild.id, args[0], {description: args.slice(1).join(" ")});
		var res2 = await bot.utils.updatePosts(bot, msg.guild.id, args[0]);
		if(res && res2) {
			msg.channel.createMessage('Description updated!');
		} else if(!res) {
			msg.channel.createMessage('Something went wrong while updating the server');
		} else if(res && !res2) {
			msg.channel.createMessage('Something went wrong while updating posts')
		} else {
			msg.channel.createMessage('Something went wrong')
		}
	},
	alias: ['desc'],
	permissions: ["manageMessages"],
	guildOnly: true
}