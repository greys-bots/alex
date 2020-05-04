module.exports = {
	help: ()=> "Sets the invite of a server.",
	usage: ()=> [" [id] [invite] - Sets invite of server that has the given ID (note: doesn't hve to be a real invite)"],
	execute: async (bot, msg, args)=> {
		var server = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!server) return 'Server not found';

		if(!args[1]) return `Current link: ${server.invite}`;

		try {
			var guild = await bot.stores.servers.update(msg.guild.id, args[0], {invite: args[1]});
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, args[0], guild);
		} catch(e) {
			return "ERR: "+e;
		}
		
		return 'Link updated!';
	},
	alias: ['invite'],
	permissions: ["manageMessages"],
	guildOnly: true
}