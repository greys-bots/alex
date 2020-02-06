module.exports = {
	help: ()=> "Sync your server to another server",
	usage: ()=> [" - Shows your current config",
				 " [serverID] - Syncs your server with another server",
				 " setup - Sets up a config for your server",
				 " enable - Lets others sync to your server",
				 " disable - Stops allowing others to sync to your server",
				 " notifs [channel] - Sets the channel for sync notifications",
				 " accept [serverID] - Manually accepts a server's sync request",
				 " deny [serverID] - Manually denies a server's sync request. Can be used even after accepting a request",
				 " cancel - Cancels your current sync request, if you have one open"],
	desc: ()=> ["This command syncs your server with a host server, giving you ban updates (configured ",
				"with `hub!ban notifs [channel]`) and syncing your member count, server name, and server icon with your server's listings."].join(""),
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getSyncConfig(bot, msg.guild.id) || {};
		//send config
		if(!args[0]) {
			return await msg.channel.createMessage({embed: {
				title: "Sync Config",
				fields: [
					{name: "Syncable?", value: `${cfg.syncable ? "Yes" : "No"}`},
					{name: "Synced Server", value: `${cfg.sync_id ? cfg.sync_id + (cfg.confirmed ? " (accepted)" : " (pending)") : "Not currently synced"}`},
					{name: "Sync Notifs Channel", value: `${cfg.sync_notifs ? (msg.guild.channels.find(ch => ch.id == cfg.sync_notifs) ? msg.guild.channels.find(ch => ch.id == cfg.sync_notifs).name : "Invalid channel! Please set again") : "Not set"}`},
					{name: "Ban Notifs Channel", value: `${cfg.ban_notifs ? (msg.guild.channels.find(ch => ch.id == cfg.ban_notifs) ? msg.guild.channels.find(ch => ch.id == cfg.ban_notifs).name : "Invalid channel! Please set again") : "Not set"}`}
				]
			}})
		}

		//do syncing
		if(!cfg || !cfg.sync_notifs) return msg.channel.createMessage("Please configure a notifications channel before attempting to sync with another server");
		if(args[0] == cfg.sync_id) return msg.channel.createMessage("You're already synced with that server!");
		if(args[0] == msg.guild.id) return msg.channel.createMessage("You can't sync with yourself!");

		var guild = await bot.guilds.find(g => g.id == args[0]);
		if(!guild) return msg.channel.createMessage("Couldn't get that guild. Make sure it exists and that I'm in it");

		var gcfg = await bot.utils.getSyncConfig(bot, guild.id);
		if(!gcfg || !gcfg.syncable || !gcfg.sync_notifs) return msg.channel.createMessage("That guild is not available to sync with");

		if(cfg.sync_id && !cfg.confirmed) return msg.channel.createMessage("You already have a pending sync request out. Please wait to change synced servers until after that request goes through, or cancel it first");
		if(cfg.syncable) {
			await msg.channel.createMessage("WARNING: Syncing your guild with another guild will stop others from syncing with yours. Are you sure you want to do this? (y/n)");
			var resp;
			var resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 30000});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting...");
			if(!["y","yes"].includes(resp[0].content.toLowerCase())) return msg.channel.createMessage("Action cancelled");

			//maybe figure out a way to alert synced servers?
			var unsync = await bot.utils.unsyncServers(bot, msg.guild.id);
			if(!unsync) return msg.channel.createMessage("Something went wrong while unsyncing servers synced to yours. Please try again");
 		}

		if(cfg.sync_id && cfg.confirmed) {
			await msg.channel.createMessage("WARNING: Syncing your guild with another guild will stop notifications from your current synced guild. Are you sure you want to do this? (y/n)");
			var resp;
			var resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 30000});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting...");
			if(!["y","yes"].includes(resp[0].content.toLowerCase())) return msg.channel.createMessage("Action cancelled");

			var req = await bot.utils.getSyncRequest(bot, cfg.sync_id, msg.guild.id);
			if(req && req.message) {
				try {
					var oldmessage = await bot.getMessage(req.channel, req.message);
					if(oldmessage) {
						var embed = oldmessage.embeds[0];
						embed.fields[2].value = "Cancelled";
						embed.color = parseInt("aa5555",16);
						embed.author = {
							name: `Cancelled by: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
							icon_url: msg.author.avatarURL
						}
						await bot.editMessage(req.channel, req.message, {embed: embed});
						await bot.utils.deleteSyncMenu(bot, oldmessage.channel.guild.id, oldmessage.channel.id, oldmessage.id);

						oldmessage.channel.createMessage({embed: {
							title: "Sync Cancellation",
							description: `The sync request from ${msg.guild.name} (${msg.guild.id}) has been cancelled.`,
							color: parseInt("aa5555", 16),
							timestamp: new Date().toISOString()
						}});
					}
				} catch(e) {
					console.log(e);
					msg.channel.createMessage("Your sync cancellation couldn't be sent to the synced server. However, you can still be unsynced")
				}

				var unsync = await bot.utils.updateSyncConfig(bot, msg.guild.id, {syncable: false, confirmed: false, sync_id: ""});
				if(!unsync) return msg.channel.createMessage("Something went wrong while trying to cancel your existing sync request. Please try again");
			}
		}

		var date = new Date();
		try {
			var message = await bot.createMessage(gcfg.sync_notifs, {embed: {
				title: "Sync Request",
				description: "Someone has requested to sync to your server!",
				fields: [
					{name: "Requesting Server", value: `${msg.guild.name} (${msg.guild.id})`},
					{name: "Requesting User", value: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`},
					{name: "Current Status", value: "Pending"}
				],
				color: parseInt("ccaa55", 16),
				footer: {
					text: `Requester ID: ${msg.guild.id}`
				},
				timestamp: date.toISOString()
			}})
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Something went wrong when sending a confirmation to that guild. Please contact the guild's admins and make sure their `sync_notifs` channel exists and that I can message it");
		}
		try {
			["✅","❌"].forEach(r => message.addReaction(r));
		} catch(e) {
			//just couldn't add the reacts, should be fine to ignore, maybe let the server know though
			console.log(e);
			message.channel.createMessage("(Couldn't add the reactions- make sure I have the `addReactions` permission! Reactions from mods should still work, however)");
		}
		
		var scc = await bot.utils.addSyncMenu(bot, message.guild.id, message.channel.id, message.id, 0, msg.guild.id, cfg.sync_notifs);
		var scc2 = await bot.utils.updateSyncConfig(bot, msg.guild.id, {syncable: false, confirmed: false, sync_id: guild.id});

		if(scc && scc2) msg.channel.createMessage("Confirmation sent! You'll get a notification when they accept/deny it");
		else if(!scc && scc2) {
			message.channel.createMessage("Something went wrong when inserting the confirmation into the database. However, this request can still be manually confirmed using `hub!sync accept` and `hub!sync deny`");
		} else if(scc && !scc2) msg.channel.createMessage("Couldn't update your sync config. This request can still be confirmed, however");
		else {
			msg.channel.createMessage("Couldn't add the sync menu or update your sync config, thus this sync attempt cannot be completed. Please try again");
			await message.edit({embed: {
				title: "Sync Request",
				description: ["Someone has requested to sync to your server!\n",
							  `UPDATE: Something went wrong when handling this sync request. This request cannot be accepted or denied.`].join(""),
				fields: [
					{name: "Requesting Server", value: `${msg.guild.name} (${msg.guild.id})`},
					{name: "Requesting User", value: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`},
					{name: "Current Status", value: "ERROR"}
				],
				color: parseInt("aa5555", 16),
				footer: {
					text: `Requester ID: ${msg.guild.id}`
				},
				timestamp: date.toISOString()
			}})
		}
	},
	guildOnly: true,
	subcommands: {},
	permissions: ["manageMessages"]
}

module.exports.subcommands.accept = {
	help: ()=> "Manually accept a server's sync request",
	usage: ()=> [" [serverID] - Accepts the given server's sync request"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a server to accept a request from");
		var request = await bot.utils.getSyncRequest(bot, msg.guild.id, args[0]);
		if(!request) return msg.channel.createMessage("Couldn't find an open request from that server");

		if(request.confirmed) return msg.channel.createMessage("That request has already been confirmed");

		if(request.message) {
			var message;
			try {
				var message = await bot.getMessage(request.channel, request.message);
				if(message) {
					var embed = message.embeds[0];
					embed.fields[2].value = "Confirmed";
					embed.color = parseInt("55aa55",16);
					embed.author = {
						name: `Accepted by: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
						icon_url: msg.author.avatarURL
					}
					await bot.editMessage(request.channel, request.message, {embed: embed});
				}
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("Notification for this request couldn't be updated; the request can still be confirmed, however");
			}
		}

		var scc = await bot.utils.updateSyncConfig(bot, request.requester, {confirmed: true});
		if(scc) {
			var ch;
			if(request.requester_channel) {
				try {
					await bot.createMessage(request.requester_channel, {embed: {
						title: "Sync Acceptance",
						description: `Your sync request with ${msg.guild.name} has been accepted!`,
						color: parseInt("55aa55", 16),
						timestamp: new Date().toISOString()
					}});
				} catch(e) {
					console.log(e);
					return msg.channel.createMessage("Couldn't send the requester the acceptance notification; please make sure they're aware that their server was accepted")
				}
			}
			msg.channel.createMessage("The sync request has been accepted!")
		} else msg.channel.createMessage("Something went wrong while updating the request. Please try again");
	},
	guildOnly: true,
	permissions: ["manageMessages"],
	alias: ["confirm"]
}

module.exports.subcommands.deny = {
	help: ()=> "Manually denies a server's sync request",
	usage: ()=> [" [serverID] - Denies the given server's sync request"],
	desc: ()=> "This command can be used to revoke a sync at any time.",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a server to deny a request from");
		var request = await bot.utils.getSyncRequest(bot, msg.guild.id, args[0]);
		if(!request) return msg.channel.createMessage("Couldn't find an open request from that server");

		if(request.message) {
			var message;
			try {
				var message = await bot.getMessage(request.channel, request.message);
				if(message) {
					var embed = message.embeds[0];
					embed.fields[2].value = "Denied";
					embed.color = parseInt("aa5555",16);
					embed.author = {
						name: `Denied by: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
						icon_url: msg.author.avatarURL
					}
					await bot.editMessage(request.channel, request.message, {embed: embed});
					await bot.utils.deleteSyncMenu(bot, message.channel.guild.id, message.channel.id, message.id);
				}
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("Notification for this request couldn't be updated; the request can still be denied, however");
			}
		}

		var scc = await bot.utils.updateSyncConfig(bot, request.requester, {confirmed: false, sync_id: ""});
		if(scc) {
			var ch;
			if(request.requester_channel) {
				try {
					await bot.createMessage(request.requester_channel, {embed: {
						title: "Sync Denial",
						description: `Your sync request with ${msg.guild.name} has been denied.${request.confirmed ? " You'll no longer receive notifications from this server." : ""}`,
						color: parseInt("aa5555", 16),
						timestamp: new Date().toISOString()
					}});
				} catch(e) {
					console.log(e);
					return msg.channel.createMessage("Couldn't send the requester the denial notification; please make sure they're aware that their server was denied")
				}
			}
			msg.channel.createMessage("The sync request has been denied");
		} else msg.channel.createMessage("Something went wrong while updating the request. Please try again");
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}

module.exports.subcommands.enable = {
	help: ()=> "[Re-]enables syncing behavior",
	usage: ()=> [" - Starts up sync notifications and allows others to sync to your server"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getSyncConfig(bot, msg.guild.id);
		if(!cfg || !cfg.sync_notifs) return msg.channel.createMessage("Please run `hub!sync notifs [channel]` before enabling syncing");
		if(cfg.enabled) return msg.channel.createMessage("Syncing is already enabled!");

		var scc = await bot.utils.updateSyncConfig(bot, msg.guild.id, {enabled: true});
		if(scc) msg.channel.createMessage("Syncing enabled!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}

module.exports.subcommands.disable = {
	help: ()=> "Temporarily stops syncing behavior",
	usage: ()=> [" - Stops others from syncing to your server and stops your server from sending sync notifications"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getSyncConfig(bot, msg.guild.id);
		if(!cfg.enabled) return msg.channel.createMessage("Syncing is already disabled!");

		var scc = await bot.utils.updateSyncConfig(bot, msg.guild.id, {enabled: false});
		if(scc) msg.channel.createMessage("Syncing disabled!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}

module.exports.subcommands.notification = {
	help: ()=> "Sets the channel for sync notifications from a host server, or for those looking to sync with your server",
	usage: ()=> [" [channel] - Sets the sync notifs channel"],
	desc: ()=> "The channel can be a #channel, ID, or channel-name",
	execute: async (bot, msg, args) => {
		var channel = msg.guild.channels.find(ch => (ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,"")) && ch.type == 0);
		if(!channel) return msg.channel.createMessage("Couldn't find that channel");

		var scc = await bot.utils.updateSyncConfig(bot, msg.guild.id, {sync_notifs: channel.id});
		if(scc) msg.channel.createMessage("Channel set! You can now allow others to sync to your server, or sync with another server");
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["notif", "notifications", "notifs"],
	guildOnly: true,
	permissions: ["manageMessages"]
}

module.exports.subcommands.setup = {
	help: ()=> "Runs a setup menu for your server",
	usage: ()=> " - Runs the syncing setup menu",
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getSyncConfig(bot, msg.guild.id);
		if(cfg && (cfg.sync_id && !cfg.confirmed)) return msg.channel.createMessage("You already have a pending sync request out. Please wait to change sync settings until after that request goes through, or cancel it first");
		var resp;
		var schan;
		var bchan;
		var sguild;

		await msg.channel.createMessage([
			"What would you like to do?",
			"```",
			"1 - Sync with another server",
			"2 - Allow others to sync to your server",
			"```"
		].join("\n"));
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 30000, maxMatches: 1});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting...");
		switch(resp[0].content) {
			case "1":
				if(cfg && cfg.syncable) {
					await msg.channel.createMessage("WARNING: Syncing your guild with another guild will stop others from syncing with yours. Are you sure you want to do this? (y/n)");
					var resp;
					var resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 30000});
					if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting...");
					if(!["y","yes"].includes(resp[0].content.toLowerCase())) return msg.channel.createMessage("Action cancelled");

					var unsync = await bot.utils.unsyncServers(bot, msg.guild.id);
					if(!unsync) return msg.channel.createMessage("Something went wrong while unsyncing servers synced to yours. Please try again");
				}

				await msg.channel.createMessage("Please enter the ID of the server you would like to sync with");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting...");
				sguild = await bot.utils.getSyncConfig(bot, resp[0].content);;
				if(!sguild || !sguild.syncable || !sguild.enabled) return msg.channel.createMessage("ERR: either I'm not in that server or that server cannot be synced with. Aborting");

				await msg.channel.createMessage("Please enter a channel for sync notifications. These are the notifications you'll get when your sync request is accepted or denied");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting...");
				schan = msg.guild.channels.find(ch => (ch.name == resp[0].content.toLowerCase() || ch.id == resp[0].content.replace(/[<#>]/g,"")) && ch.type == 0);
				if(!schan) return msg.channel.createMessage("ERR: couldn't find the given channel. Aborting");

				await msg.channel.createMessage("Please enter a channel for ban notifications. These are the notifications you'll get when members in your server are banned in the synced server, or when members you have banned are unbanned there");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting...");
				bchan = msg.guild.channels.find(ch => (ch.name == resp[0].content.toLowerCase() || ch.id == resp[0].content.replace(/[<#>]/g,"")) && ch.type == 0);
				if(!bchan) return msg.channel.createMessage("ERR: couldn't find the given channel. Aborting");

				var date = new Date();
				try {
					var message = await bot.createMessage(sguild.sync_notifs, {embed: {
						title: "Sync Request",
						description: "Someone has requested to sync to your server!",
						fields: [
							{name: "Requesting Server", value: `${msg.guild.name} (${msg.guild.id})`},
							{name: "Requesting User", value: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`},
							{name: "Current Status", value: "Pending"}
						],
						color: parseInt("ccaa55", 16),
						footer: {
							text: `Requester ID: ${msg.guild.id}`
						},
						timestamp: date.toISOString()
					}})
				} catch(e) {
					console.log(e);
					return msg.channel.createMessage("Something went wrong when sending a confirmation to that guild. Please contact the guild's admins and make sure their `sync_notifs` channel exists and that I can message it");
				}
				try {
					["✅","❌"].forEach(r => message.addReaction(r));
				} catch(e) {
					//just couldn't add the reacts, should be fine to ignore, maybe let the server know though
					console.log(e);
					message.channel.createMessage("(Couldn't add the reactions- make sure I have the `addReactions` permission! Reactions from mods should still work, however)");
				}
				
				var scc = await bot.utils.addSyncMenu(bot, message.guild.id, message.channel.id, message.id, 0, msg.guild.id, schan.id);
				var scc2 = await bot.utils.updateSyncConfig(bot, msg.guild.id, {syncable: false, confirmed: false, sync_id: sguild.server_id, sync_notifs: schan.id, ban_notifs: bchan.id, enabled: true});

				if(scc && scc2) msg.channel.createMessage("Confirmation sent! You'll get a notification when they accept/deny it");
				else if(!scc && scc2) {
					msg.channel.createMessage("Something went wrong when inserting the confirmation into the database. However, this request can still be manually confirmed using `hub!sync accept` and `hub!sync deny`");
				} else if(scc && !scc2) msg.channel.createMessage("Couldn't update your sync config. This request can still be confirmed, however");
				else {
					msg.channel.createMessage("Couldn't add the sync menu or update your sync config, thus this sync attempt cannot be completed. Please try again");
					await message.edit({embed: {
						title: "Sync Request",
						description: ["Someone has requested to sync to your server!\n",
									  `UPDATE: Something went wrong when handling this sync request. This request cannot be accepted or denied.`].join(""),
						fields: [
							{name: "Requesting Server", value: `${msg.guild.name} (${msg.guild.id})`},
							{name: "Requesting User", value: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`},
							{name: "Current Status", value: "ERROR"}
						],
						color: parseInt("aa5555", 16),
						footer: {
							text: `Requester ID: ${msg.guild.id}`
						},
						timestamp: date.toISOString()
					}})
				}
				break;
			case "2":
				if(cfg && cfg.sync_id && cfg.confirmed) {
					await msg.channel.createMessage("WARNING: Allowing others to sync with your guild will terminate your current sync link. Are you sure you want to do this? (y/n)");
					resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 30000});
					if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting...");
					if(!["y","yes"].includes(resp[0].content.toLowerCase())) return msg.channel.createMessage("Action cancelled");

					var req = await bot.utils.getSyncRequest(bot, cfg.sync_id, msg.guild.id);
						if(req && req.message) {
							try {
								var oldmessage = await bot.getMessage(req.channel, req.message);
								if(oldmessage) {
									var embed = oldmessage.embeds[0];
									embed.fields[2].value = "Cancelled";
									embed.color = parseInt("aa5555",16);
									embed.author = {
										name: `Cancelled by: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
										icon_url: msg.author.avatarURL
									}
									await bot.editMessage(req.channel, req.message, {embed: embed});
									await bot.utils.deleteSyncMenu(bot, oldmessage.channel.guild.id, oldmessage.channel.id, oldmessage.id);

									oldmessage.channel.createMessage({embed: {
										title: "Sync Cancellation",
										description: `The sync request from ${msg.guild.name} (${msg.guild.id}) has been cancelled.`,
										color: parseInt("aa5555", 16),
										timestamp: new Date().toISOString()
									}});
								}
							} catch(e) {
								console.log(e);
								msg.channel.createMessage("Your sync cancellation couldn't be sent to the synced server. However, you can still be unsynced")
							}

							var unsync = await bot.utils.updateSyncConfig(bot, msg.guild.id, {syncable: false, confirmed: false, sync_id: ""});
							if(!unsync) return msg.channel.createMessage("Something went wrong while trying to cancel your existing sync request. Please try again");
						}
				}
				await msg.channel.createMessage("Please enter a channel for sync notifications. These are the notifications you'll get when others request to sync with you");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
				schan = msg.guild.channels.find(ch => (ch.name == resp[0].content.toLowerCase() || ch.id == resp[0].content.replace(/[<#>]/g,"")) && ch.type == 0);
				if(!schan) return msg.channel.createMessage("ERR: couldn't find the given channel. Aborting");

				await msg.channel.createMessage("Please enter a channel for ban notifications. These are the notifications you'll get when a server synced with yours bans a user");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting...");
				bchan = msg.guild.channels.find(ch => (ch.name == resp[0].content.toLowerCase() || ch.id == resp[0].content.replace(/[<#>]/g,"")) && ch.type == 0);
				if(!bchan) return msg.channel.createMessage("ERR: couldn't find the given channel. Aborting");

				var scc = await bot.utils.updateSyncConfig(bot, msg.guild.id, {syncable: true, confirmed: false, sync_id: "", sync_notifs: schan.id, ban_notifs: bchan.id, enabled: true});
				if(scc) msg.channel.createMessage("Syncing enabled!");
				else msg.channel.createMessage("Something went wrong");
				break;
			default:
				msg.channel.createMessage("ERR: invalid input. Aborting");
				break;
		}
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}

module.exports.subcommands.cancel = {
	help: ()=> "Cancels an outgoing sync request, or terminates an existing sync link",
	usage: ()=> [" - Cancels/terminates your current sync setup"],
	desc: ()=> "This command can be used to cancel syncing at any time.",
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getSyncConfig(bot, msg.guild.id);
		if(!cfg || !cfg.sync_id) return msg.channel.createMessage("Nothing to cancel");

		var request = await bot.utils.getSyncRequest(bot, cfg.sync_id, msg.guild.id);

		if(request && request.message) {
			var message;
			try {
				var message = await bot.getMessage(request.channel, request.message);
				if(message) {
					if(message) {
						var embed = message.embeds[0];
						embed.fields[2].value = "Cancelled";
						embed.color = parseInt("aa5555",16);
						embed.author = {
							name: `Cancelled by: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
							icon_url: msg.author.avatarURL
						}
						await bot.editMessage(req.channel, req.message, {embed: embed});
						await bot.utils.deleteSyncMenu(bot, message.channel.guild.id, message.channel.id, message.id);

						await message.channel.createMessage({embed: {
							title: "Sync Cancellation",
							description: `The sync request from ${msg.guild.name} (${msg.guild.id}) has been cancelled.`,
							color: parseInt("aa5555", 16),
							timestamp: new Date().toISOString()
						}});
						await bot.utils.deleteSyncMenu(bot, message.channel.guild.id, message.channel.id, message.id);
					}
				}
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("Notification for this request couldn't be updated; the request can still be cancelled, however");
			}
		}

		var scc = await bot.utils.updateSyncConfig(bot, msg.guild.id, {confirmed: false, sync_id: ""});
		if(scc) msg.channel.createMessage(`Sync ${cfg.confirmed ? "terminated" : "cancelled"}!`)
		else msg.channel.createMessage("Something went wrong while updating the request. Please try again");
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}