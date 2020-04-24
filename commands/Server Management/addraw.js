module.exports = {
	help: ()=> "Adds a server without resolving an invite.",
	usage: ()=> [" [ID] <name>- Adds server without resolving an invite and gives it a name if provided"],
	execute: async (bot, msg, args)=>{
		var exists = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(exists) return 'Server already exists!';
		if(isNaN(parseInt(args[0]))) return 'Server ID should be an integer';
		
		try {
			await bot.stores.servers.create(msg.guild.id, args[0], {name: args.slice(1).join(" ")});
		} catch(e) {
			return "ERR: "+e;
		}
		
		return `Server added! ID: ${args[0]}`;
	},
	permissions: ["manageMessages"],
	guildOnly: true
}