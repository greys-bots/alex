module.exports = {
	help: ()=> "Manage server support tickets",
	usage: ()=> [" - List open tickets",
				 " post [channel] - Post the ticket starter message to a channel. Channel can be a #mention, an ID, or the channel-name",
				 " bind [channel] [messageID] - Bind ticket reacts to a specific message. Channel can be a #mention, an ID, or the channel-name",
				 " unbind [channel] [messageID] - Unbind ticket reacts from a specific message. Channel can be a #mention, and ID, or the channel-name",
				 " add <hid> [user] [user] ... - Add users to a ticket. Users can be @ mentions or IDs. Up to 10 users can be added to a ticket (others can be manually added via permissions)",
				 " remove <hid> [user] [user] ... - Remove users from a ticket. Users can be @ mentions or IDs",
				 " find [userID] - Find tickets started by the given user",
				 " archive <hid> - Archive a ticket (sends text transcript to command user and deletes channel). NOTE: Does NOT save images. If no hid is given, attempts to archive the current channel's ticket",
				 " delete [hid] - Delete a ticket. NOTE: Does not archive it automatically; use this if you don't plan on archiving it",
				 " config - Configure the ticket system. Use `hub!help ticket config` for more info"],
	desc: ()=> "Before using this, you should run `hub!ticket config`. Use `hub!ticket post [channel]` or `hub!ticket bind [channel] [messageID]` to open the system for reactions and ticket creation. Users can have a total of 5 tickets open at once to prevent spam.",
	execute: async (bot, msg, args) => {
		var tickets = await bot.utils.getSupportTickets(bot, msg.guild.id);
		if(!tickets) return msg.channel.createMessage("No support tickets registered for this server");

		if(tickets.length > 10) {
			var embeds = await bot.utils.genEmbeds(bot, tickets, async dat => {
				return {
					name: `Ticket ${dat.hid}`,
					value: [
						`[first message](https://discordapp.com/channels/${msg.guild.id}/${dat.channel_id}/${dat.first_message})`,
						`Opener: ${dat.opener.username}#${dat.opener.discriminator} (${dat.opener.id})`
						`Users:\n${dat.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")}`
					].join("\n\n")
				}
			}, {
				title: "Server Suport Tickets",
				description: `Total tickets: ${tickets.length}`
			});
			
			msg.channel.createMessage(embeds[0]).then(message => {
				if(!bot.pages) bot.pages = {};
				bot.pages[message.id] = {
					user: msg.author.id,
					index: 0,
					data: embeds
				};
				message.addReaction("\u2b05");
				message.addReaction("\u27a1");
				message.addReaction("\u23f9");
				setTimeout(()=> {
					if(!bot.pages[message.id]) return;
					message.removeReaction("\u2b05");
					message.removeReaction("\u27a1");
					message.removeReaction("\u23f9");
					delete bot.pages[msg.author.id];
				}, 900000)
			})
		} else {
			msg.channel.createMessage({embed: {
				title: "Server Support Tickets",
				description: `Total tickets: ${tickets.length}`,
				fields: tickets.map(t => {
					return {
						name: `Ticket ${t.hid}`,
						value: [
							`[first message](https://discordapp.com/channels/${msg.guild.id}/${t.channel_id}/${t.first_message})`,
							`Opener: ${t.opener.username}#${t.opener.discriminator} (${t.opener.id})`,
							`Users:\n${t.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")}`
						].join("\n")
					}
				})
			}})
		}
	},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["support","tickets"],
	subcommands: {}
}

module.exports.subcommands.post = {
	help: ()=> "Post a message that users can react to in order to open tickets",
	usage: ()=> [" [channel] - Post the starter message"],
	desc: ()=> "The channel can be a #mention, channel ID, or channel-name",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a channel to post to");

		var cfg = await bot.utils.getSupportConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please run `hub!ticket config` before doing this");

		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[0].toLowerCase());
		if(!channel) return msg.channel.createMessage("Channel not found");

		try {
			var message = await channel.createMessage({embed: {
				title: "Start Ticket",
				description: "React to this post with ✅ to start a new ticket.\n\nNOTE: Users can have 5 tickets open at once.",
				color: 2074412
			}});
		} catch(e) {
			console.log(e.stack);
			return msg.channel.createMessage("ERR: \n"+e.message);
		}

		try {
			message.addReaction("✅")
		} catch(e) {
			console.log(e.stack);
			return msg.channel.createMessage("ERR: \n"+e.message);
		}

		var scc = await bot.utils.addTicketPost(bot, msg.guild.id, message.channel.id, message.id);
		if(scc) msg.channel.createMessage("Post sent!");
		else msg.channel.createMessage("Something went wrong")
	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.config = {
	help: ()=> "Configure ticket system settings",
	usage: ()=> [" - Show the current config",
				 " setup - Run the config menu"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getSupportConfig(bot, msg.guild.id);
		if(!cfg) cfg = {category_id: "", archives_id: ""};

		var category = cfg.category_id != "" ? msg.guild.channels.find(c => c.id == cfg.category_id) : undefined;
		var archives = cfg.archives_id != "" ? msg.guild.channels.find(c => c.id == cfg.archives_id) : undefined;

		if(!args[0] || args[0] != "setup") return msg.channel.createMessage({embed: {
			title: "Ticket Config",
			fields: [
				{name: "Category ID", value: (category ? category.name.toLowerCase() : "*(not set)*")},
				{name: "Archive channel ID", value: (archives ? archives.name.toLowerCase() : "*(not set)*")}
			]
		}});

		var resp;
		
		await msg.channel.createMessage("Enter the category that tickets should be created in. This can be the category name or ID. You have 1 minute to do this\nNOTE: This category's permissions should only allow mods and I to see channels; I handle individual permissions for users!"+(category ? "\nType `skip` to keep the current value" : ""));
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60,maxMatches:1});
		if(!resp[0]) return msg.channel.createMessage("Action cancelled: timed out");
		if(!(category && resp[0].content.toLowerCase() == "skip")) category = await msg.guild.channels.find(c => (c.id == resp[0].content || c.name.toLowerCase() == resp[0].content.toLowerCase()) && c.type == 4);
		if(!category) return msg.channel.createMessage("Action cancelled: category not found");

		await msg.channel.createMessage("Enter the channel that archived tickets should be sent to. This can be the channel name, #mention, or ID. You have 1 minute to do this\nNOTE: This is not required. Type `skip` to skip it, and archives will be sent to your DMs instead");;
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60,maxMatches:1});
		if(!resp[0]) return msg.channel.createMessage("Action cancelled: timed out");
		if(resp[0].content.toLowerCase() != "skip") archives = await msg.guild.channels.find(c => (c.id == resp[0].content || c.name.toLowerCase() == resp[0].content.replace(/<#>/g,"").toLowerCase()) && c.type == 0);
		if(!archives && resp[0].toLowerCase() != "skip") return msg.channel.createMessage("Action cancelled: category not found");

		var scc;
		if(cfg.category_id == "") {
			scc = await bot.utils.createSupportConfig(bot, msg.guild.id, category.id, archives.id);
		} else {
			scc = await bot.utils.updateSupportConfig(bot, msg.guild.id, ["category_id", category.id, "archives_id", archives.id]);
		}

		if(scc) msg.channel.createMessage("Config set!");
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ['conf', 'cfg']
}

module.exports.subcommands.archive = {
	help: ()=> "Archive a support ticket",
	usage: ()=> [" - Sends the user a text transcript of the channel's ticket and deletes the channel",
				 " [hid] - Sends the user a text transcript of the ticket with the given hid and deletes its channel"],
	desc: ()=> "This command does NOT save images. Please save images yourself before using the command!",
	execute: async (bot, msg, args) => {
		var config = await bot.utils.getSupportConfig(bot, msg.guild.id);
		if(!config) config = {archives_id: null};
		
		var ticket = args[0] ? await bot.utils.getSupportTicket(bot, msg.guild.id, args[0].toLowerCase()) : await bot.utils.getSupportTicketByChannel(bot, msg.guild.id, msg.channel.id);
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel");

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return msg.channel.createMessage("Couldn't find the channel associated with that ticket");

		var messages = await channel.getMessages(10000, null, ticket.first_message);
		if(!messages) return msg.channel.createMessage("Either that channel has no messages or I couldn't get them");

		var data = [];
		messages.forEach(m => {
			var date = new Date(m.timestamp);
			data.push([`ID: ${m.id}`,
						`\r\n${m.author.username}#${m.author.discriminator + (m.author.bot ? " BOT" : "")} (${m.author.id})`,
						` | ${date.getMonth()+1}.${date.getDate()}.${date.getFullYear()}`,
						` at ${date.getHours()}:${date.getMinutes()}`,
						`\r\n${m.content}`].join(""))
		})

		var c;
		if(config.archives_id) {
			c = msg.guild.channels.find(ch => ch.id == config.archives_id);
			if(!c) return msg.channel.createMessage("Couldn't find your archives channel; please reconfigure it");

			var date = new Date();

			var embed = {
				title: "Support Ticket Archive",
				fields: [
					{name: "Time opened", value: bot.formatTime(new Date(ticket.timestamp))},
					{name: "Opener", value: `${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})`},
					{name: "Users involved", value: ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")},
					{name: "Time closed", value: bot.formatTime(date)}
				],
				timestamp: date.toISOString(),
				color: 5821280
			}
			try {
				c.createMessage({embed: embed},{file: Buffer.from([`Ticket opened: ${bot.formatTime(new Date(ticket.timestamp))}\r\n`,
				`Ticket opener: ${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})\r\n`,
				 `Users involved:\r\n${ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"].join("")+data.reverse().join("\r\n------\r\n")),name: channel.name+".txt"})
			} catch(e) {
				console.log(e);
				return msg.channel.createMessage("Error while sending the archive:\n"+e.message+"\n\nAction aborted due to error");
			}
		} else {
			c = await bot.getDMChannel(msg.author.id);
			if(!c) return msg.channel.createMessage("Please make sure I can DM you");

			try {
				c.createMessage("Here is the archive:",{file: Buffer.from([`Ticket opened: ${bot.formatTime(new Date(ticket.timestamp))}\r\n`,
				`Ticket opener: ${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})\r\n`,
				 `Users involved:\r\n${ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"].join("")+data.reverse().join("\r\n------\r\n")),name: channel.name+".txt"})
			} catch(e) {
				console.log(e);
				return msg.channel.createMessage("Error while DMing the archive:\n"+e.message+"\n\nAction aborted due to error");
			}

		}

		try {
			channel.delete("Ticket archived");
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Error while deleting channel:\n"+e.message)
		}

		var scc = await bot.utils.deleteSupportTicket(bot, msg.guild.id, channel.id);
		if(!scc) {
			channel.id == msg.channel.id ? c.createMessage("Ticket archived, but could not be deleted from the database") : msg.channel.createMessage("Ticket archived, but could not be deleted from the database")
		}
	},
	permissions: ['manageMessages'],
	guildOnly: true
}

module.exports.subcommands.delete = {
	help: ()=> "Delete a support ticket",
	usage: ()=> [" - Deletes the current channel's ticket and associated channel",
				 " [hid] - Deletes the given ticket and its associated channel"],
	execute: async (bot, msg, args) => {
		var ticket = args[0] ? await bot.utils.getSupportTicket(bot, msg.guild.id, args[0].toLowerCase()) : await bot.utils.getSupportTicketByChannel(bot, msg.guild.id, msg.channel.id);
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel");

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return msg.channel.createMessage("Couldn't find the channel associated with that ticket");

		try {
			channel.delete("Ticket deleted");
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Error while deleting channel:\n"+e.message)
		}

		var c = await bot.getDMChannel(msg.author.id);
		if(!c) return msg.channel.createMessage("Please make sure I can DM you");

		var scc = await bot.utils.deleteSupportTicket(bot, msg.guild.id, channel.id);
		if(scc) {
			channel.id == msg.channel.id ? c.createMessage("Ticket successfully deleted!") : msg.channel.createMessage("Ticket successfully deleted!")
		} else {
			channel.id == msg.channel.id ? c.createMessage("Channel deleted, but the ticket could not be deleted from the database") : msg.channel.createMessage("Channel deleted, but the ticket could not be deleted from the database")
		}
	},
	permissions: ['manageMessages'],
	guildOnly: true
}

module.exports.subcommands.add = {
	help: ()=> "Add users to a support ticket",
	usage: ()=> [" [user] [user] ... - Add users to the support ticket attached to the current channel",
				 " [hid] [user] [user] ... - Add users to a support ticket with the given hid"],
	desc: ()=> "Users can be @mentions or user IDs. Up to 10 users can be added to a ticket via commands - others will need to be added manually. This does not include moderators or the original opener of the ticket.",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide users to add to the ticket");

		var ids;
		var ticket = await bot.utils.getSupportTicket(bot, msg.guild.id, args[0].toLowerCase());
		if(ticket) ids = args.slice(1).map(id => id.replace(/[<@!>]/g,""));
		else {
			ticket = await bot.utils.getSupportTicketByChannel(bot, msg.guild.id, msg.channel.id);
			ids = args.map(id => id.replace(/[<@!>]/g,""))
		}
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel");

		if(ids.length > 10 || (ids.length + ticket.users.length-1) > 10) return msg.channel.createMessage("Only to 10 users can be added to tickets via the command.");
		ids = ticket.users.map(u => u.id).concat(ids.filter(id => !ticket.users.includes(id)));

		var members = msg.guild.members.filter(m => ids.includes(m.id));
		if(!members || !members[0]) return msg.channel.createMessage("Please provide valid members to add to the ticket");

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return msg.channel.createMessage("ERR: Couldn't get the channel associated with that ticket");

		try {
			await Promise.all(members.map(m => {
				return channel.editPermission(m.id, 1024, 0, "member");
			}))
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR:\n"+e.message);
		}

		var message = await msg.channel.getMessage(ticket.first_message);
		if(!message) msg.channel.createMessage("Couldn't get the ticket's first message; users have been added, but won't be shown there")
		else {
			try {
				await message.edit({embed: {
					title: "Ticket opened!",
					fields: [
						{name: "Ticket Opener", value: members[0].mention},
						{name: "Ticket Users", value: members.map(m => m.mention).join("\n")}
					],
					color: 2074412,
					footer: {
						text: "Ticket ID: "+ticket.hid
					},
					timestamp: ticket.timestamp
				}})
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("Couldn't edit ticket message; users have been added, but won't be reflected there");
			}
		}

		var scc = await bot.utils.editSupportTicket(bot, msg.guild.id, ticket.hid, "users", members.map(m => m.id));
		if(scc) msg.channel.createMessage("Users added to ticket!");
		else msg.channel.createMessage("Users added to channel, but could not be saved to the ticket");

	},
	permissions: ['manageMessages'],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Remove users from a ticket",
	usage: ()=> [" [user] [user] ... - Remove users from the support ticket attached to the current channel",
				 " [hid] [user] [user] ... - Remove users from a support ticket with the given hid"],
	desc: ()=> "Users can be @mentions or user IDs. You cannot remove the ticket opener from the ticket via commands.",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide users to remove from the ticket");

		var ids;
		var ticket = await bot.utils.getSupportTicket(bot, msg.guild.id, args[0].toLowerCase());
		if(ticket) ids = args.slice(1).map(id => id.replace(/[<@!>]/g,""));
		else {
			ticket = await bot.utils.getSupportTicketByChannel(bot, msg.guild.id, msg.channel.id);
			ids = args.map(id => id.replace(/[<@!>]/g,""))
		}
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel");

		ids = ids.filter(id => ticket.userids.includes(id) && id != ticket.opener.id);

		var members = msg.guild.members.filter(m => ids.includes(m.id));
		if(!members || !members[0]) return msg.channel.createMessage("Please provide valid members to add to the ticket");

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return msg.channel.createMessage("ERR: Couldn't get the channel associated with that ticket");

		try {
			await Promise.all(members.map(m => {
				return channel.editPermission(m.id, 0, 1024, "member");
			}))
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR:\n"+e.message);
		}

		var message = await msg.channel.getMessage(ticket.first_message);
		if(!message) msg.channel.createMessage("Couldn't get the ticket's first message; users have been added, but won't be shown there")
		else {
			try {
				await message.edit({embed: {
					title: "Ticket opened!",
					fields: [
						{name: "Ticket Opener", value: message.embeds[0].fields[0].value},
						{name: "Ticket Users", value: message.embeds[0].fields[1].value.split("\n").filter(m => !ids.includes(m.replace(/[<@!>]/g,""))).join("\n")}
					],
					color: 2074412,
					footer: {
						text: "Ticket ID: "+ticket.hid
					},
					timestamp: ticket.timestamp
				}})
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("Couldn't edit ticket message; users have been removed, but won't be reflected there");
			}
		}

		var scc = await bot.utils.editSupportTicket(bot, msg.guild.id, ticket.hid, "users", ticket.userids.filter(u => !ids.includes(u)));
		if(scc) msg.channel.createMessage("Users removed from ticket!");
		else msg.channel.createMessage("Users removed from channel, but could not be saved to the ticket");

	},
	permissions: ['manageMessages'],
	guildOnly: true
}

module.exports.subcommands.bind = {
	help: ()=> "Bind the ticket starter reaction to a custom message",
	usage: ()=> [" [channel] [messageID] - Bind the reaction to a message"],
	desc: ()=> "The channel can be a #mention, ID, or channel-name",
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide the channel and message ID to bind the reaction to");

		var cfg = await bot.utils.getSupportConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please run `hub!ticket config setup` before doing this");

		var channel = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g,"") || ch.name == args[0].toLowerCase());
		if(!channel) return msg.channel.createMessage("Channel not found");
		var message = await bot.getMessage(channel.id, args[1]);
		if(!message) return msg.channel.createMessage("Message not found");

		try {
			message.addReaction("✅")
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR: Couldn't add the reaction; aborting");
		}

		var scc = await bot.utils.addTicketPost(bot, msg.guild.id, message.channel.id, message.id);
		if(scc) msg.channel.createMessage("Reaction bound!");
		else msg.channel.createMessage("Something went wrong")		

	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.unbind = {
	help: ()=> "Unbind the ticket starter reaction from a custom message",
	usage: ()=> [" [channel] [messageID] - Unbind the reaction from a message"],
	desc: ()=> "The channel can be a #mention, ID, or channel-name",
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide the channel and message ID to unbind the reaction from");

		var channel = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g,"") || ch.name == args[0].toLowerCase());
		if(!channel) return msg.channel.createMessage("Channel not found");
		var message = await bot.getMessage(channel.id, args[1]);
		if(!message) return msg.channel.createMessage("Message not found");

		try {
			message.removeReaction("✅")
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR: Couldn't remove the reaction; aborting");
		}

		var scc = await bot.utils.deleteTicketPost(bot, msg.guild.id, message.channel.id, message.id);
		if(scc) msg.channel.createMessage("Reaction unbound!");
		else msg.channel.createMessage("Something went wrong")		

	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.find = {
	help: ()=> "Find tickets opened by a specific user",
	usage: ()=> [" [user] - Find tickets from the given user"],
	desc: ()=> "User can be a @mention or ID. Does not include past tickets, as those are fully deleted from the database",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a user to search for tickets from");

		var tickets = await bot.utils.getSupportTicketsByUser(bot, msg.guild.id, args[0].replace(/[<@!>]/g,""));

		if(!tickets) return msg.channel.createMessage("No tickets from that user found");

		msg.channel.createMessage({embed: {
			title: "Tickets Found",
			description: tickets.map(t => `ID: ${t.hid} | Opened: ${bot.formatTime(new Date(t.timestamp))}`).join("\n")
		}})
	}
}