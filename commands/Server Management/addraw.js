module.exports = {
	help: ()=> "Adds a server without resolving an invite.",
	usage: ()=> [" [ID] <name>- Adds server without resolving an invite and gives it a name if provided"],
	execute: async (bot, msg, args)=>{
		var exists = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(exists) return msg.channel.createMessage('Server already exists!');
		
		var scc = await bot.utils.addServer(
			bot,
			msg.guild.id,
			args[0],
			args.slice(1).join(" "),
			"",
			""
		);
		if(scc) msg.channel.createMessage(`Server added! ID: ${args[0]}`);
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageMessages"],
	guildOnly: true
}