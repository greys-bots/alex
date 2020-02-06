module.exports = {
	help: ()=> "Adds a server.",
	usage: ()=> [" [invite] - Adds server and grabs data from the invite"],
	execute: async (bot, msg, args)=>{
		let id = args[0].match(/(?:.*)+\/(.*)$/) ?
				 args[0].match(/(?:.*)+\/(.*)$/)[1] :
				 args[0];
		let invite;
		try {
			invite = await bot.getInvite(id);
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Couldn't get that invite");
		}
		
		var exists = await bot.utils.getServer(bot, msg.guild.id, invite.guild.id);
		if(exists) return msg.channel.createMessage("Server already exists!");

		var scc = await bot.utils.addServer(
				bot,
				msg.guild.id,
				invite.guild.id,
				invite.guild.name, 
				"https://discord.gg/"+invite.code,
				`https://cdn.discordapp.com/icons/${invite.guild.id}/${invite.guild.icon}.jpg?size=128`
		);
		if(scc) msg.channel.createMessage("Server added! ID: "+invite.guild.id);
		else msg.channel.createMessage("Something went wrong")
	},
	permissions: ["manageMessages"], //so basic mods can help
	guildOnly: true
}