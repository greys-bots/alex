module.exports = {
	help: ()=> "Deletes server(s)",
	usage: ()=> [" [serverID] [serverID...] (new line) [reason] - Deletes given server(s) and all posts related."],
	execute: async (bot, msg, args) => {
		var guilds = args.join(" ").split("\n")[0].split(" ");
		var reason = args.join(" ").split("\n").slice(1).join("\n") || "(no reason given)";
		var conf = await bot.utils.getConfig(bot, msg.guild.id);
		var embeds = [];
		var logs = [];
		var date = new Date();

		for(var i = 0; i < guilds.length; i++) {
			var guild = await bot.utils.getServer(bot, msg.guild.id, guilds[i]);
			if(!guild) return msg.channel.createMessage('Server not found.');
			var res = await bot.utils.deletePosts(bot, msg.guild.id, guilds[i]);
			if(!res) return msg.channel.createMessage('Something went wrong while deleting posts.');

			var dat = await bot.utils.verifyUsers(bot, guild.contact_id.split(" "));

			var res2 = await bot.utils.deleteServer(bot, msg.guild.id, guild.id);
			if(!res2) return msg.channel.createMessage('Something went wrong while deleting server.');
			msg.channel.createMessage('Server deleted!');

			var newreason = reason;
			Object.keys(bot.logVars).forEach(lv => {
				newreason = newreason.replace(lv, eval("`"+bot.logVars[lv]+"`","g"));
			})

			embeds.push({
				title: "Server Delisted",
				fields: [
					{name: "Server Name", value: guild.name || "(no name)"},
					{name: "Delist Reason", value: newreason}
				],
				thumbnail: {
					url: "https://cdn.discordapp.com/attachments/585890796671336451/585890824659795980/Plural_Hub_Ban_logo.png"
				},
				timestamp: date
			})
			logs.push({name: guild.name || "(no name)", id: guild.server_id, reason: newreason})

			if(!conf) continue;
			if(!conf.reprole) continue;			

			for(var j = 0; j < dat.pass.length; j++) {
				var mg = await bot.utils.getServersWithContact(bot, msg.guild.id, dat.pass[j]);
				if(!mg || mg.length == 0) {
					try {
						await msg.guild.removeMemberRole(dat.pass[j], conf.reprole)
						return new Promise(res => setTimeout(()=> res(1), 100))
					} catch(e) {
						console.log(e);
					}
				}
			}
		}

		if(conf.delist_channel) {
			var channel = msg.guild.channels.find(ch => ch.id == conf.delist_channel);
			if(!channel) channel = msg.channel;

			var results = []

			for(var i = 0; i < embeds.length; i++) {
				var code = bot.utils.genCode(bot.chars);
				embeds[i].footer = {text: code};
				var message;
				try {
					message = await channel.createMessage({embed: embeds[i]});
				} catch(e) {
					console.log(e);
					results.push({succ: false, data: logs[i], reason: "Message wasn't sent"});
					continue;
				}

				var scc = await bot.utils.addListingLog(bot, code, msg.guild.id, message.channel.id, message.id, logs[i].name, logs[i].reason, date, 0);
				if(scc) results.push({succ: true, data: logs[i], code: code});
				else results.push({succ: false, data: logs[i], reason: "Couldn't add listing log"});
			}

			msg.channel.createMessage({embed: {
				title: "Results",
				fields: [
					{name: "Logged", value: results.filter(r => r.succ).map(r => `${r.data.name} (${r.data.id}) | Log ID: ${r.code}`).join("\n") || "(none)"},
					{name: "Not Logged", value: results.filter(r => !r.succ).map(r => `${r.data.name} (${r.data.id}) | Reason: ${r.reason}`).join("\n") || "(none)"}
				],
				timestamp: date
			}})
		}
		
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
		if(!args[1]) return msg.channel.createMessage("Please provide a log ID and a reason");
		var log = await bot.utils.getListingLog(bot, args[0].toLowerCase(), msg.guild.id);
		var reason = args.slice(1).join(" ");

		if(!log) return msg.channel.createMessage("Log not found");
		else if(log == "deleted") return msg.channel.createMessage("Log was deleted due to the message no longer existing");

		try {
			log.embed.fields[1].value = reason;
			bot.editMessage(log.channel_id, log.message_id, {embed: log.embed});
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Something went wrong")
		}
		
		var scc = await bot.utils.updateListingLog(bot, log.hid, msg.guild.id, {reason: reason})
		if(scc) msg.channel.createMessage("Log edited!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}

module.exports.subcommands.list = {
	help: ()=> "List indexed listing logs",
	usage: ()=> [" - Lists the server's indexed listing logs"],
	execute: async (bot, msg, args) => {
		var logs = await bot.utils.getRawListingLogs(bot, msg.guild.id);
		if(!logs || !logs[0]) return msg.channel.createMessage("No logs registered for this server");

		var embeds = logs.map(l => {
			return {
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
		})
		
		
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}