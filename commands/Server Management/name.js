module.exports = {
	help: ()=> "Sets the name of a server.",
	usage: ()=> [" [id] [name] - Sets name of server that has the given ID"],
	execute: async (bot, msg, args)=> {
		var server = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!server) return 'Server not found';

		var url;
		if(args[1]) url = args[1];
		else if(msg.attachments && msg.attachments[0]) url = msg.attachments[0].url;
		else return `Current name: ${server.name}`;

		try {
			var guild = await bot.stores.servers.update(msg.guild.id, args[0], {name: args.slice(1).join(" ")});
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, args[0], guild);
		} catch(e) {
			return "ERR: "+e;
		}
		
		return 'Name updated!';
	},
	permissions: ["manageMessages"],
	guildOnly: true
}