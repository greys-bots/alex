module.exports = {
	help: ()=> "Adds a server.",
	usage: ()=> [" [invite] - Adds server and grabs data from the invite"],
	execute: async (bot, msg, args)=>{
		let id = args[0].match(/(?:.*)+\/(.*)$/) ?
				 args[0].match(/(?:.*)+\/(.*)$/)[1] :
				 args[0];
		let invite;
		let guild;
		await bot.getInvite(id).then(async inv=>{
			invite = inv;
			console.log(inv)
			var exists = await bot.utils.getServer(bot, msg.guild.id, invite.guild.id);
			console.log(exists);
			if(exists) return msg.channel.createMessage("Server already exists!");
			bot.db.query(`INSERT INTO servers (host_id, server_id, name, invite, pic_url) VALUES (?,?,?,?,?)`,[
				msg.guild.id,
				invite.guild.id,
				invite.guild.name, 
				"https://discord.gg/"+invite.code,
				`https://cdn.discordapp.com/icons/${invite.guild.id}/${invite.guild.icon}.jpg?size=128`
			]);
			msg.channel.createMessage(`Server added! ID: ${invite.guild.id}`);

		}).catch(e=>{
			console.log(e);
			msg.channel.createMessage("That invite is not valid.")
		});
	},
	permissions: ["manageMessages"] //so basic mods can help
}