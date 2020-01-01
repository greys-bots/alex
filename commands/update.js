module.exports = {
	help: ()=> "Updates a server's info using an invite",
	usage: ()=> [" [invite] - Updates the server that the invite belongs to (NOTE: use a new invite to replace the existing one",
				 " all - Attempts to update all servers"],
	execute: async (bot, msg, args) => {
		let id = args[0].match(/(?:.*)+\/(.*)$/) ?
				 args[0].match(/(?:.*)+\/(.*)$/)[1] :
				 args[0];
		let invite;
		let guild;
		await bot.getInvite(id).then(async inv=>{
			invite = inv;
			var guild = await bot.utils.getServer(bot, msg.guild.id, invite.guild.id);
			if(!guild) return msg.channel.createMessage("Server not found");
			await bot.utils.updateHostedServer(bot, msg.guild.id, invite.guild.id, 
				{name: invite.guild.name, invite: `https://discord.gg/${invite.code}`, 
				pic_url: `https://cdn.discordapp.com/icons/${invite.guild.id}/${invite.guild.icon}.jpg?size=128`})

			var res = await bot.utils.updatePosts(bot, msg.guild.id, invite.guild.id);
			if(!res) {
				msg.channel.createMessage('Something went wrong while updating post')
			} else {
				msg.channel.createMessage('Server updated!')
			}

		}).catch(e=>{
			console.log(e);
			msg.channel.createMessage("That invite is not valid or there was an error.")
		});
	},
	permissions: ["manageMessages"],
	subcommands: {},
	guildOnly: true
}

module.exports.subcommands.all = {
	help: ()=> "Attempts to update all listed servers",
	usage: ()=> [" - Tries to do the updating thing"],
	execute: async (bot, msg, args) => {
		var servers = await bot.utils.getServers(bot, msg.guild.id);
		if(!servers || !servers[0]) return msg.channel.createMessage("You don't have any servers registered");

		var failed = [];

		for(var i = 0; i < servers.length; i++) {
			if(bot.guilds.find(g => g.id == servers[i].server_id)) {
				var guild = bot.guilds.find(g => g.id == servers[i].server_id);
				await bot.utils.updateHostedServer(bot, msg.guild.id, guild.id, 
								{name: guild.name, 
								pic_url: guild.iconURL});

			} else {
				let id = servers[i].invite.match(/(?:.*)+\/(.*)$/) ?
						 servers[i].invite.match(/(?:.*)+\/(.*)$/)[1] :
						 "";
				let invite;
				if(id) {
					try {
						await bot.getInvite(id).then(async inv=>{
							invite = inv;
							await bot.utils.updateHostedServer(bot, msg.guild.id, invite.guild.id, 
								{name: invite.guild.name, invite: `https://discord.gg/${invite.code}`, 
								pic_url: `https://cdn.discordapp.com/icons/${invite.guild.id}/${invite.guild.icon}.jpg?size=128`})

						})
					} catch(e) {
						console.log(e);
					}
				}
			}
			
			var res = await bot.utils.updatePosts(bot, msg.guild.id, servers[i].server_id);
			if(!res) {
				failed.push(servers[i].name);
			}
		}

		if(failed.length > 0) {
			msg.channel.createMessage({embed: {
				title: "Failed Updates",
				description: failed.join("\n")
			}})
		} else {
			msg.channel.createMessage("All posts have been successfully updated!");
		}
	},
	alias: ["*"],
	permissions: ["manageMessages"],
	guildOnly: true
}