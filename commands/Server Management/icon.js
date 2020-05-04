module.exports = {
	help: ()=> "Edits a server's icon.",
	usage: ()=> [" [id] [url] - Sets server's icon to given url"],
	execute: async (bot, msg, args) => {
		var server = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!server) return 'Server not found';

		var url;
		if(args[1]) url = args[1];
		else if(msg.attachments && msg.attachments[0]) url = msg.attachments[0].url;
		else return `Current icon: ${server.pic_url}`;

		try {
			var guild = await bot.stores.servers.update(msg.guild.id, args[0], {pic_url: url});
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, args[0], guild);
		} catch(e) {
			return "ERR: "+e;
		}
		
		return 'Icon updated!';
	},
	alias: ['pic', 'avatar', 'image', 'img', 'picture'],
	permissions: ["manageMessages"],
	guildOnly: true
}