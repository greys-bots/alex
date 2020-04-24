module.exports = {
	help: ()=> "Sets the description of a server.",
	usage: ()=> [" [id] [description] - Sets description of server that has the given ID"],
	execute: async (bot, msg, args)=> {
		var server = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!server) return 'Server not found';

		if(!args[1]) return `Current description:\n${server.description}`;

		try {
			var guild = await bot.stores.servers.update(msg.guild.id, args[0], {description: args.slice(1).join(" ")});
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, args[0], guild);
		} catch(e) {
			return "ERR: "+e;
		}
		
		return 'Description updated!';
	},
	alias: ['desc'],
	permissions: ["manageMessages"],
	guildOnly: true
}