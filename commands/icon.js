module.exports = {
	help: ()=> "Edits a server's icon.",
	usage: ()=> [" [id] [url] - Sets server's icon to given url"],
	execute: async (bot, msg, args) => {
		var guild = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(!guild) return msg.channel.createMessage('Server not found');

		var res = await bot.utils.updateServer(bot, msg.guild.id, args[0], 'icon', args.slice(1).join(" "));
		var res2 = await bot.utils.updatePosts(bot, msg.guild.id, args[0]);
		if(res && res2) {
			msg.channel.createMessage('Icon updated!');
		} else if(!res) {
			msg.channel.createMessage('Something went wrong while updating the server');
		} else if(res && !res2) {
			msg.channel.createMessage('Something went wrong while updating posts')
		} else {
			msg.channel.createMessage('Something went wrong')
		}
	},
	alias: ['pic', 'avatar', 'image', 'img', 'picture'],
	permissions: ["manageMessages"]
}