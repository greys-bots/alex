module.exports = {
	help: ()=> "[Hack]bans members.",
	usage: ()=> [" - Lists all registered ban logs",
				 " [userID] [userID] ... <reason> - Bans member(s) with the given ID(s)",
				 " edit [banID] [new reason] - Edit the reason for a ban"],
	execute: async (bot, msg, args)=>{
		if(!args[0]) {
			try {
				var logs = await bot.stores.banLogs.getAll(msg.guild.id);
			} catch(e) {
				return "ERR: "+e
			}
			
			if(!logs || !logs[0]) return "No bans registered for this server";
			var embeds = logs.map((l,i) => {
				l.embed.title += ` (log ${i+1}/${logs.length})`;
				return {embed: l.embed}
			});

			return embeds;
		}

		//parsing for both space delimited and new line delimited stuff
		var membs = [];
		var reason = [];
		for(var i = 0; i < args.length; i++) {
			if(args[i].match(/^\d{17,}$/)) membs.push(args[i]);
			else if(args[i].match(/^\d{17,}\n/)) {
				var tmp = args[i].split("\n");
				membs = membs.concat(tmp.slice(0, tmp.length-1))
				reason.push(tmp[tmp.length-1]);
			} else reason.push(args[i])
		}
		reason = reason.join(" ");

		try {
			var conf = await bot.stores.configs.get(msg.guild.id);
			var b = await msg.guild.getBans()
		} catch(e) {
			console.log(e);
			return "ERR: "+ (e.message || e);
		}
		
		if(!conf) conf = {};
		else if(conf.ban_message) {
			Object.keys(bot.banVars).forEach(bv => {
				conf.ban_message = conf.ban_message.replace(bv, eval("`"+bot.banVars[bv]+"`","g"));
			})
		}
		var succ = [];
		for(var i = 0; i < membs.length; i++) {
			var u;
			try {
				u = bot.users.find(us => us.id == membs[i]);
				if(!u) u = await bot.getRESTUser(membs[i])
			} catch(e) {
				console.log(e);
				succ.push({id: membs[i], pass: false, reason: "User does not exist"});
			}

			if(b && b.find(x => x.user.id == membs[i])) {
				succ.push({id:membs[i], pass:true, info:u});
			} else {
				if(msg.guild.members.find(mb => mb.id == membs[i]) && conf.banmsg) {
					var ch = await bot.getDMChannel(membs[i]);
					if(ch) {
						try {
							ch.createMessage(conf.ban_message);
						} catch(e) {
							console.log(e.stack)
						}
					}
				}
				bot.banGuildMember(msg.guild.id, membs[i], 0, reason || "Banned through command.");
				succ.push({id: membs[i], pass: true, info: u})
			}
		}

		var message;
		var channel;
		var code = bot.utils.genCode(bot.chars);
		var date = new Date();

		if(!(succ.filter(m => m.pass).length > 0)) {
			return {content:'**No users were banned.**', embed: {
				title: "Results",
				fields: [
				{
					name: "Not Banned", value: (succ.filter(m => !m.pass).length > 0 ? succ.filter(x => !x.pass).map(m => m.id + " - " + m.reason).join("\n") : "None")
				}
				]
			}};
		}

		if(conf && conf.banlog_channel && msg.guild.channels.find(ch => ch.id == conf.banlog_channel))
			var channel = msg.guild.channels.find(ch => ch.id == conf.banlog_channel);
		else channel = msg.channel;

		var message = await channel.createMessage({embed: {
			title: "Members Banned",
			fields: [
			{
				name: "**__Last Known Usernames__**",
				value: (succ.filter(x=> x.pass).map(m => `${m.info.username}#${m.info.discriminator}`).join("\n")) || "Something went wrong"
			},
			{
				name: "**__User IDs__**",
				value: (succ.filter(x=> x.pass).map(m => m.id).join("\n")) || "Something went wrong"
			},
			{
				name: "**__Reason__**",
				value: reason || "(no reason given)"
			}
			],
			color: 9256253,
			footer: {
				text: code
			},
			timestamp: date
		}});
		var banned = succ.filter(m => m.pass).map(u => u.id);
		if(succ.filter(m => !m.pass).length > 0) {
			msg.channel.createMessage({content:'**Some users were not banned.**', embed: {
				title: "Results",
				fields: [
				{
					name: "Not Banned", value: (succ.filter(m => !m.pass).length > 0 ? succ.filter(x => !x.pass).map(m => m.id + " - " + m.reason).join("\n") : "None")
				}
				]
			}});
		}

		try {
			await bot.stores.banLogs.create(msg.guild.id, code, {channel_id: message.channel.id, message_id: message.id, users: banned, reason, timestamp: date});
			msg.channel.createMessage("Log added! ID: "+code);
		} catch(e) {
			console.log(e);
			msg.channel.createMessage("The members have been banned, but the log was not successfully indexed.");
		}

		var scfg = await bot.stores.syncConfigs.get(msg.guild.id);
		if(!scfg) return;
		if(scfg.syncable && scfg.enabled) {
			var synced = await bot.stores.syncConfigs.getSynced(msg.guild.id);
			if(!synced || !synced[0]) return;
			for(var i = 0; i < synced.length; i++) {
				if(!synced[i].ban_notifs) continue;
				
				if(synced[i].guild.members.find(m => banned.includes(m.id))) {
					var tb = synced[i].guild.members.filter(m => banned.includes(m.id));
					try {
						await bot.createMessage(synced[i].ban_notifs, {embed: {
							title: "Ban Notification",
							description: [`These users are in your server and have been banned from ${msg.guild.name}.\n`,
										  `This was the given reason:\n`,
										  reason || "(no reason given)"].join(""),
							fields: tb.map(m => {
								return {name: `${m.username}#${m.discriminator}`, value: m.id}
							}),
							color: parseInt("aa5555", 16)
						}})
					} catch(e) {
						console.log(e);
						return `ERR: ${e.message}\nServer: ${synced[i].guild.name} (${synced[i].guild.id})`;
					}
				}
			}
		} else if(scfg.sync_id && scfg.confirmed) {
			scfg = await bot.stores.syncConfigs.get(scfg.sync_id);
			if(!scfg.ban_notifs) return;
			try {
				await bot.createMessage(scfg.ban_notifs, {embed: {
					title: "Ban Notification",
					description: [`These users were banned from synced server ${msg.guild.name} (${msg.guild.id}).\n`,
								  `This was the given reason:\n`,
								  reason || "(no reason given)"].join(""),
					fields: succ.filter(x=> x.pass).map(m => {
						return {name: `${m.info.username}#${m.info.discriminator}`, value: m.info.id}
					}),
					color: parseInt("aa5555", 16)
				}})
			} catch(e) {
				console.log(e);
				//guess we'll die
			}
		}	
	},
	permissions: ["manageMessages"],
	subcommands: {},
	alias: ["bans", "hackban", "hackbans"],
	guildOnly: true
}

module.exports.subcommands.edit = {
	help: ()=> "Edit a ban message",
	usage: ()=> [" [banID] [new message] - Edit the message on a ban"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a ban ID and a reason";
		var log = await bot.stores.banLogs.get(args[0].toLowerCase(), msg.guild.id);
		var reason = args.slice(1).join(" ");

		if(!log) return "Log not found";
		else if(log == "deleted") return "Log was deleted due to the message no longer existing";

		try {
			bot.editMessage(log.channel_id, log.message_id, {embed: {
				title: log.embed.title,
				fields: [log.embed.fields[0], log.embed.fields[1], {
					name: "**__Reason__**",
					value: reason
				}],
				color: log.embed.color,
				timestamp: log.embed.timestamp,
				footer: log.embed.footer
			}})
			await bot.stores.banLogs.update(msg.guild.id, log.hid, {reason: reason})
		} catch(e) {
			console.log(e);
			return "ERR: "+(e.message || e);
		}
		
		return "Log edited!";
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}

module.exports.subcommands.notification = {
	help: ()=> "Sets the channel for ban notifications from a host server, or notifications back from synced servers. For use with `hub!sync`",
	usage: ()=> [" [channel] - Sets the ban notifs channel"],
	desc: ()=> "The channel can be a #channel, ID, or channel-name",
	execute: async (bot, msg, args) => {
		var config = bot.stores.syncConigs.get(msg.guild.id);
		var channel = msg.guild.channels.find(ch => (ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,"")) && ch.type == 0);
		if(!channel) return "Couldn't find that channel";

		try {
			if(config) await bot.stores.syncConfigs.update(msg.guild.id, {ban_notifs: channel.id});
			else await bot.stores.syncConfigs.create(msg.guild.id, {ban_notifs: channel.id});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Channel set! Make sure you sync your server with another in order to get the full effect";
	},
	alias: ["notif", "notifications", "notifs"],
	guildOnly: true,
	permissions: ["manageMessages"]
}

//function to fix old logs, if needed
// module.exports.subcommands.index = {
// 	execute: async (bot, msg, args) => {
// 		var logs = await bot.utils.getBanLogs(bot, msg.guild.id);
// 		if(!logs || !logs[0]) return msg.channel.createMessage("No logs registered for this server");
// 		var date = new Date();

// 		msg.addReaction(process.env.HOURGLASS || "⌛");
// 		for(var i = 0; i < logs.length; i++) {
// 			await bot.utils.updateBanLog(bot, logs[i].hid, msg.guild.id, {reason: logs[i].embed && logs[i].embed.fields && logs[i].embed.fields[2] ? logs[i].embed.fields[2].value : "(no reason given)", timestamp: logs[i].embed ? logs[i].embed.timestamp : date.toISOString()})
// 		}
// 		msg.removeReaction(process.env.HOURGLASS || "⌛");
		
// 		msg.channel.createMessage("Ban logs indexed!");
// 	},
// 	permissions: ["manageMessages"]
// }