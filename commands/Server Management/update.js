module.exports = {
	help: ()=> "Updates a server's info using an invite",
	usage: ()=> [" [invite] - Updates the server that the invite belongs to (NOTE: use a new invite to replace the existing one",
				 " all - Attempts to update all servers"],
	execute: async (bot, msg, args) => {
		if(!args) return "Please provide an invite for the server you want to update";
		var match = args[0].match(/(?:.*)+\/(.*)$/);
		var id = match ? match[1] : args[0];

		try {
			var invite = await bot.getInvite(id);
			var guild = await bot.stores.servers.get(msg.guild.id, invite.guild.id);
			if(!guild) return "Server not found!";
			var guild = await bot.stores.servers.update(msg.guild.id, invite.guild.id, {
				name: invite.guild.name,
				invite: `https://discord.gg/${invite.code}`, 
				pic_url: `https://cdn.discordapp.com/icons/${invite.guild.id}/${invite.guild.icon}.jpg?size=128`
			});
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, guild.server_id, guild);
		} catch(e) {
			console.log(e);
			return "ERR: "+(e.message || e);
		}

		return 'Server updated!';
	},
	permissions: ["manageMessages"],
	subcommands: {},
	guildOnly: true
}

module.exports.subcommands.all = {
	help: ()=> "Attempts to update all listed servers",
	usage: ()=> [" - Tries to do the updating thing"],
	execute: async (bot, msg, args) => {
		var servers = await bot.stores.servers.getAll(msg.guild.id);
		if(!servers || !servers[0]) return "You don't have any servers registered";

		var failed = [];

		for(var i = 0; i < servers.length; i++) {
			var guild;
			if(bot.guilds.find(g => g.id == servers[i].server_id)) {
				guild = bot.guilds.find(g => g.id == servers[i].server_id);
				try {
					guild = await bot.stores.servers.update(msg.guild.id, guild.id, {name: guild.name, pic_url: guild.iconURL});
				} catch(e) {
					console.log(e);
					failed.push({name: servers[i].name, value: `Couldn't update server (${e.message})`});
					continue;
				}
			} else if(servers[i].invite) {
				if(!(servers[i].invite.includes("discord.gg") || servers[i].invite.includes("discordapp.com"))) continue;
				let id = servers[i].invite.match(/(?:.*)+\/(.*)$/) ?
						 servers[i].invite.match(/(?:.*)+\/(.*)$/)[1] :
						 "";
				let invite;
				if(id) {
					try {
						invite = await bot.getInvite(id);
						guild = await bot.stores.servers.update(msg.guild.id, invite.guild.id, 
							{name: invite.guild.name, invite: `https://discord.gg/${invite.code}`, 
							pic_url: `https://cdn.discordapp.com/icons/${invite.guild.id}/${invite.guild.icon}.jpg?size=128`})
					} catch(e) {
						console.log(e);
						failed.push({name: servers[i].name, value: `Couldn't update server (${e.message})`});
						continue;
					}
				}
			} else continue;
			
			try {
				await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, guild.server_id, guild);
			} catch(e) {
				console.log(e);
				failed.push({name: servers[i].name, value: `Couldn't update posts (${e.message})`});
			}
		}

		if(failed.length > 0) {
			return {content: "Some servers could not be updated!", embed: {
				title: "Failed Updates",
				fields: failed
			}};
		} else {
			return "All posts have been successfully updated!";
		}
	},
	alias: ["*"],
	permissions: ["manageMessages"],
	guildOnly: true
}