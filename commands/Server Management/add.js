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
			return "ERR: "+e.message;
		}
		
		var exists = await bot.stores.servers.get(msg.guild.id, invite.guild.id);
		if(exists) return "Server already exists!";

		try {
			await bot.stores.servers.create(msg.guild.id, invite.guild.id, {
				name: invite.guild.name, 
				invite: "https://discord.gg/"+invite.code,
				pic_url: `https://cdn.discordapp.com/icons/${invite.guild.id}/${invite.guild.icon}.jpg?size=128`
			});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Server added! ID: "+invite.guild.id;
	},
	permissions: ["manageMessages"],
	guildOnly: true
}