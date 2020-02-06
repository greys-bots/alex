module.exports = async (msg, emoji, user, bot)=>{
	if(bot.user.id == user) return;

	if(bot.menus && bot.menus[msg.id] && bot.menus[msg.id].user == user) {
		try {
			await bot.menus[msg.id].execute(bot, msg, emoji);
		} catch(e) {
			console.log(e);
			writeLog(e);
			msg.channel.createMessage("Something went wrong: "+e.message);
		}
	}

	if(!msg.channel.guild) return;

	var cfg = await bot.utils.getConfig(bot, msg.channel.guild.id);
	if(cfg && cfg.blacklist && cfg.blacklist.includes(user)) return;
	if(cfg && cfg.starboard && cfg.starboard.boards) {
		var em;
		if(emoji.id) em = `:${emoji.name}:${emoji.id}`;
		else em = emoji.name; 
		var cf = cfg.starboard.boards.find(c => c.emoji == em);
		if(cf) {
			var sbpost = await bot.utils.getStarPost(bot, msg.channel.guild.id, msg.id, em);
			var message = await bot.getMessage(msg.channel.id, msg.id);
			if(!sbpost) {
				var chan = cf.channel;
				var member = msg.channel.guild.members.find(m => m.id == user);
				var tolerance = cf.tolerance ? cf.tolerance : (cfg.starboard.tolerance || 2);
				if((member.permission.has("manageMessages") && cfg.starboard.override) || (message.reactions[em.replace(/^:/,"")].count === tolerance)) {
					bot.utils.starMessage(bot, message, chan, {emoji: em, count: message.reactions[em.replace(/^:/,"")].count})
				}
			} else {
				await bot.utils.updateStarPost(bot, msg.channel.guild.id, msg.id, {emoji: em, count: message.reactions[em.replace(/^:/,"")].count})
			}
		}
	}

	var message;
	try {
		message = await bot.getMessage(msg.channel.id, msg.id);
	} catch(e) {
		if(!(e.stack.includes("Unknown Message") && emoji.name == "\u23f9")) console.log(e);
		return;
	}

	var smenu = await bot.utils.getSyncMenu(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	if(smenu) {
		if(!["✅", "❌"].includes(emoji.name)) return;
		var request = await bot.utils.getSyncRequest(bot, msg.channel.guild.id, smenu.reply_guild);
		if(!request) return;
		if(message) var embed = message.embeds[0];
		var member = await bot.utils.fetchUser(bot, user);
		switch(emoji.name) {
			case "✅":
				if(request.confirmed) {
					try {
						await message.removeReaction("✅", user);
					} catch(e) {
						console.log(e)
					}
					return;
				}

				try {
					if(embed) {
						embed.fields[2].value = "Confirmed";
						embed.color = parseInt("55aa55", 16);
						embed.author = {
							name: `Accepted by: ${member.username}#${member.discriminator} (${member.id})`,
							icon_url: member.avatarURL
						}
						await bot.editMessage(message.channel.id, message.id, {embed: embed});
						await message.removeReactions();
					}
				} catch(e) {
					console.log(e);
					message.channel.createMessage("Notification for this request couldn't be updated; the request can still be confirmed, however");
				}

				var scc = await bot.utils.updateSyncConfig(bot, smenu.reply_guild, {confirmed: true});
				if(scc) {
					try {
						await bot.createMessage(smenu.reply_channel, {embed: {
							title: "Sync Acceptance",
							description: `Your sync request with ${message.guild.name} has been accepted!`,
							color: parseInt("55aa55", 16),
							timestamp: new Date().toISOString()
						}});
					} catch(e) {
						console.log(e);
						message.channel.createMessage("Couldn't send the requester the acceptance notification; please make sure they're aware that their server was accepted and that they should use `hub!ban notifs [channel]` if they want ban notifications")
					}
				} else message.channel.createMessage("Something went wrong while updating the request. Please try again");
				break;
			case "❌":
				if(!request.confirmed) {
					try {
						await message.removeReaction("❌", user);
					} catch(e) {
						console.log(e)
					}
					return;
				}

				try {
					if(embed) {
						embed.fields[2].value = "Denied";
						embed.color = parseInt("aa5555", 16);
						embed.author = {
							name: `Denied by: ${member.username}#${member.discriminator} (${member.id})`,
							icon_url: member.avatarURL
						}
						await bot.editMessage(message.channel.id, message.id, {embed: embed});
						await message.removeReactions();
						await bot.utils.deleteSyncMenu(bot, message.channel.guild.id, message.channel.id, message.id);
					}
				} catch(e) {
					console.log(e);
					message.channel.createMessage("Notification for this request couldn't be updated; the request can still be denied, however");
				}

				var scc = await bot.utils.updateSyncConfig(bot, smenu.reply_guild, {confirmed: true});
				if(scc) {
					try {
						await bot.createMessage(smenu.reply_channel, {embed: {
							title: "Sync Denial",
							description: `Your sync request with ${message.guild.name} has been denied.${request.confirmed ? " You'll no longer receive notifications from this server." : ""}`,
							color: parseInt("aa5555", 16),
							timestamp: new Date().toISOString()
						}});
					} catch(e) {
						console.log(e);
						message.channel.createMessage("Couldn't send the requester the acceptance notification; please make sure they're aware that their server was accepted")
					}
				} else message.channel.createMessage("Something went wrong while updating the request. Please try again");
				break;
		}
	}

	var post = await bot.utils.getReactionRolePost(bot, msg.channel.guild.id, msg.id);
	if(post) {
		var role = post.roles.find(r => (emoji.id ? r.emoji == `:${emoji.name}:${emoji.id}` || r.emoji == `a:${emoji.name}:${emoji.id}` : r.emoji == emoji.name));
		if(!role) return;
		var rl = msg.channel.guild.roles.find(r => r.id == role.role_id);
		if(!rl) return;
		var member = msg.channel.guild.members.find(m => m.id == user);
		if(!member) return;
		if(member.roles.includes(rl.id)) {
			try {
				msg.channel.guild.removeMemberRole(user, rl.id);
				bot.removeMessageReaction(msg.channel.id, msg.id, emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, user);
			} catch(e) {
				console.log(e);
				await bot.getDMChannel(user).then(ch => {
					ch.createMessage(`Couldn't give you role **${rl.name}** in ${msg.channel.guild.name}. Please let a moderator know that something went wrong`)
				})
			}
		} else {
			try {
				msg.channel.guild.addMemberRole(user, rl.id);
				bot.removeMessageReaction(msg.channel.id, msg.id, emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, user);
			} catch(e) {
				console.log(e);
				await bot.getDMChannel(user).then(ch => {
					ch.createMessage(`Couldn't give you role **${rl.name}** in ${msg.channel.guild.name}. Please let a moderator know that something went wrong`)
				})
			}
		}
	}

	if(emoji.name == "\u2753" || emoji.name == "\u2754") {
		var log = await bot.utils.getBanLogByMessage(bot, msg.channel.guild.id, msg.channel.id, msg.id);
		if(!log) return;

		var ch = await bot.getDMChannel(user);
		if(!ch) return;

		var receipt = await bot.utils.getReceipt(bot, log.hid, msg.channel.guild.id);
		if(!receipt) return ch.channel.createMessage("No receipt has been registered for that ban :(");

		var users = await bot.utils.verifyUsers(bot, log.embed.fields[1].value.split("\n"));

		try {
			ch.createMessage({embed: {
				title: "Ban Receipt",
				description: receipt.message,
				fields: [
					{name: "Users Banned", value: users.info.map(u => `${u.username}#${u.discriminator} (${u.id})`).concat(users.fail.map(u => `${u} - Member deleted?`)).join("\n")},
					{name: "Reason", value: log.embed.fields[2].value}
				]
			}})
			bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name, user);
		} catch(e) {
			console.log(e);
		}
	}

	var tpost = await bot.utils.getTicketPost(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	if(tpost) {
		await bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name, user);
		var ch = await bot.getDMChannel(user);
		var tickets = await bot.utils.getSupportTicketsByUser(bot, msg.channel.guild.id, user);
		if(tickets && tickets.length >= 5) {
			try {
				return ch.createMessage("Couldn't open ticket: you already have 5 open for that server")
			} catch(e) {
				console.log(e);
				return;
			}
		}
		var us = await bot.utils.fetchUser(bot, user);
		var ticket = await bot.utils.createSupportTicket(bot, msg.channel.guild.id, us);
		if(!ticket.hid) {
			try {
				ch.createMessage("Couldn't open your support ticket:\n"+ticket.err);
			} catch(e) {
				console.log(e);
				return;
			}	
		}
	}
}