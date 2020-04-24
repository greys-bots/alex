module.exports = {
	help: ()=> "Deletes server(s)",
	usage: ()=> [" [serverID] [serverID...] (new line) [reason] - Deletes given server(s) and all posts related."],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a server to delete";
		var nargs = args.join(" ").split("\n");
		var guilds = nargs[0].split(" ");
		var reason = nargs.slice(1).join("\n") || "(no reason given)";
		var conf = await bot.stores.configs.get(msg.guild.id);
		var embeds = [];
		var date = new Date().toISOString();
		var channel;
		if(conf.delist_channel) {
			channel = msg.guild.channels.find(ch => ch.id == conf.delist_channel);
			if(!channel) channel = msg.channel;
		} else channel = msg.channel;

		var results = [];
		for(var i = 0; i < guilds.length; i++) {
			var guild = await bot.stores.servers.get(msg.guild.id, guilds[i]);
			if(!guild) {
				results.push({success: false, id: guilds[i], reason: "Guild not found"});
				continue;
			}

			try {
				var nreason = reason;
				Object.keys(bot.logVars).forEach(lv => {
					nreason = nreason.replace(lv, eval("`"+bot.logVars[lv]+"`","g"));
				})
				var code = bot.utils.genCode(bot.chars);
				console.log("deleting posts")
				await bot.stores.serverPosts.deleteByHostedServer(msg.guild.id, guilds[i]);
				console.log("deleting server")
				await bot.stores.servers.delete(msg.guild.id, guild.server_id);
				var message = await channel.createMessage({embed: {
					title: "Server Delisted",
					fields: [
						{name: "Server Name", value: guild.name || "(no name)"},
						{name: "Delist Reason", value: nreason}
					],
					thumbnail: {
						url: "https://cdn.discordapp.com/attachments/585890796671336451/585890824659795980/Plural_Hub_Ban_logo.png"
					},
					timestamp: date,
					footer: {text: code}
				}})
				await bot.stores.listingLogs.create(msg.guild.id, code, {
					channel_id: channel.id,
					message_id: message.id,
					server_name: guild.name || "(no name)",
					reason: nreason,
					timestamp: date,
					type: 0
				});

				if(!conf || !conf.reprole) {
					results.push({success: true, name: guild.name || "(no name)", id: guild.server_id, code})
					continue;
				}


				if(guild.contact_id && guild.contact_id[0]) {
					for(var id of guild.contact_id) {
						var mg = await bot.stores.servers.getWithContact(msg.guild.id, id);
						if(!mg || mg.length == 0) await msg.guild.removeMemberRole(id, conf.reprole);
					}
				}
			} catch(e) {
				results.push({success: false, name: guild.name || "(no name)", id: guild.server_id, reason: e.message || e});
				continue;
			}
			
			results.push({success: true, name: guild.name || "(no name)", id: guild.server_id, code})
		}

		return {embed: {
			title: "Results",
			fields: [
				{name: "Logged", value: results.filter(r => r.success).map(r => `${r.name} (${r.id}) | Log ID: ${r.code}`).join("\n") || "(none)"},
				{name: "Not Logged", value: results.filter(r => !r.success).map(r => `${r.name} (${r.id}) | Reason: ${r.reason}`).join("\n") || "(none)"}
			],
			timestamp: date
		}};
	},
	alias: ['delist'],
	permissions: ["manageMessages"],
	subcommands: {},
	guildOnly: true
}

module.exports.subcommands.edit = {
	help: ()=> "Edit a delisting message",
	usage: ()=> [" [logID] [new message] - Edits the message on a delisting log"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a log ID and a reason";
		var log = await bot.stores.listingLogs.get(msg.guild.id, args[0].toLowerCase());
		var reason = args.slice(1).join(" ");

		if(!log || log == "deleted") return "Log not found";

		try {
			await bot.stores.listingLogs.update(msg.guild.id, log.hid, {reason})
		} catch(e) {
			console.log(e);
			return "ERR: "+e;
		}
		
		return "Log edited!";
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}

module.exports.subcommands.list = {
	help: ()=> "List indexed listing logs",
	usage: ()=> [" - Lists the server's indexed listing logs"],
	execute: async (bot, msg, args) => {
		var logs = await bot.stores.listingLogs.getAll(msg.guild.id);
		if(!logs || !logs[0]) return "No logs registered for this server";

		var embeds = logs.map(l => {
			return {embed: {
				title: `**Server ${l.type == 0 ? "Delisted" : "Denied"}**`,
				fields: [
					{name: "Server Name", value: l.server_name},
					{name: `${l.type == 0 ? "Delist" : "Denial"} Reason`, value: l.reason}
				],
				thumbnail: {
					url: "https://cdn.discordapp.com/attachments/585890796671336451/585890824659795980/Plural_Hub_Ban_logo.png"
				},
				timestamp: l.timestamp,
				footer: {
					text: l.hid
				}
	 		}
		}})

		if(embeds.length > 1)
			for(var i = 0; i < embeds.length; i++)
				embeds[i].embed.title += ` (${i+1}/${embeds.length})`;
		return embeds;
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}