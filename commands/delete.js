module.exports = {
	help: ()=> "Deletes a server",
	usage: ()=> [" [serverID] [reason] - Deletes given server and all posts about it."],
	execute: async (bot, msg, args) => {
		var guilds = args.join(" ").split("\n")[0].split(" ");
		var embeds = [];
		var reason = args.join(" ").split("\n").slice(1).join("\n") || "(no reason given)";
		var conf = await bot.utils.getConfig(bot, msg.guild.id);

		await Promise.all(guilds.map(async g => {
			var guild = await bot.utils.getServer(bot, msg.guild.id, g);
			if(!guild) return msg.channel.createMessage('Server not found.');
			var res = await bot.utils.deletePosts(bot, msg.guild.id, g);
			if(!res) return msg.channel.createMessage('Something went wrong while deleting posts.');

			var dat = await bot.utils.verifyUsers(bot, guild.contact_id.split(" "));

			var res2 = await bot.utils.deleteServer(bot, msg.guild.id, guild.id);
			if(!res2) return msg.channel.createMessage('Something went wrong while deleting server.');
			msg.channel.createMessage('Server deleted!');

			embeds.push({name: guild.name || "(no name)"})

			if(!conf) return;
			if(conf.reprole) {
			if(!conf.reprole) return;
				await Promise.all(dat.pass.map(async m => {
					var mg = await bot.utils.getServersWithContact(bot, msg.guild.id, m);
					console.log(mg);
					if(!mg || mg.length == 0) {
						try {
							await msg.guild.removeMemberRole(m, conf.reprole)
							return new Promise(res => setTimeout(()=> res(1), 100))
						} catch(e) {
							console.log(e);
						}
					}
				}))
			}
		}));

		if(conf.delist_channel) {
			var channel = msg.guild.channels.find(ch => ch.id == conf.delist_channel);
			if(!channel) channel = message.channel;

			embeds.forEach(e => {
				channel.createMessage({embed: {
					title: "Server Delisted",
					fields: [
						{name: "Server Name", value: e.name || "(unnamed)"},
						{name: "Delist Reason", value: reason}
					],
					thumbnail: {
						url: "https://cdn.discordapp.com/attachments/585890796671336451/585890824659795980/Plural_Hub_Ban_logo.png"
					},
					timestamp: new Date()
				}})
			})
		}
		
	},
	alias: ['delist'],
	permissions: ["manageMessages"]
}
