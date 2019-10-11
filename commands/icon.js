module.exports = {
	help: ()=> "Edits a server's icon.",
	usage: ()=> [" [id] <url> - Sets server's icon. If no url is given, uses the first attached image"],
	execute: async (bot, msg, args) => {
		var guild = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(!guild) return msg.channel.createMessage('Server not found');

		var url;

		if(args[1]) url = args[1];
		else if(msg.attachments[0]) url = msg.attachments[0].url;
		else return msg.channel.createMessage("Please provide a url or attach an image");

		var res = await bot.utils.updateServer(bot, msg.guild.id, args[0], 'pic_url', url);
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