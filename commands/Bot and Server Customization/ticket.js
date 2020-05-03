module.exports = {
	help: ()=> "Manage server support tickets",
	usage: ()=> [" - List open tickets",
				 " post [channel] - Post the ticket starter message to a channel",
				 " bind [channel] [messageID] - Bind ticket reacts to a specific message",
				 " unbind [channel] [messageID] - Unbind ticket reacts from a specific message",
				 " add <hid> [user] [user] ... - Add users to a ticket",
				 " remove <hid> [user] [user] ... - Remove users from a ticket",
				 " find [userID] - Find tickets started by the given user",
				 " archive <hid> - Archive a ticket (sends text transcript to command user and deletes channel)",
				 " delete [hid] - Delete a ticket. NOTE: Does not archive it automatically; use this if you don't plan on archiving it",
				 " config - Configure the ticket system"],
	desc: ()=> "Before using this, you should run `ha!ticket config`. Use `ha!ticket post [channel]` or `ha!ticket bind [channel] [messageID]` to open the system for reactions and ticket creation. Users can have a total of 5 tickets open at once to prevent spam.",
	execute: async (bot, msg, args) => {
		var tickets = await bot.stores.tickets.getAll(msg.guild.id);
		if(!tickets || !tickets[0]) return "No support tickets registered for this server";

		var embeds = tickets.map(t => {
			return {embed: {
				title: `Ticket ${t.hid}`,
				fields: [
					{name: "First message", value: `[clicky!](https://discordapp.com/channels/${msg.guild.id}/${t.channel_id}/${t.first_message})`},
					{name: "Ticket opener", value: `${t.opener.mention} (${t.opener.username}#${t.opener.discriminator})`},
					{name: "Ticket users", value: `${[t.opener].concat(t.users).map(u => `${u.mention} (${u.username}#${u.discriminator})`)}`}
				],
				timestamp: t.timestamp
			}}
		})

		console.log(embeds[1]);

		if(embeds[1]) for(var i = 0; i < embeds.length; i++) embeds[i].embed.title += ` (${i+1}/${embeds.length})`;

		return embeds;
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
		if(!args[0]) return "Please provide a channel to post to";

		var cfg = await bot.stores.ticketConfigs.get(msg.guild.id);
		if(!cfg) return "Please run `ha!ticket config` before doing this";

		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[0].toLowerCase());
		if(!channel) return "Channel not found";

		try {
			var message = await channel.createMessage({embed: {
				title: "Start Ticket",
				description: "React to this post with ✅ to start a new ticket.\n\nNOTE: Users can have 5 tickets open at once.",
				color: 2074412
			}});
		} catch(e) {
			console.log(e.stack);
			return "ERR: \n"+e.message;
		}

		try {
			message.addReaction("✅")
		} catch(e) {
			console.log(e.stack);
			return "ERR: \n"+e.message;
		}

		try {
			await bot.stores.ticketPosts.create(msg.guild.id, message.channel.id, message.id);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Post sent!";
	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.config = {
	help: ()=> "Configure ticket system settings",
	usage: ()=> [" - Show the current config",
				 " setup - Run the config menu"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.ticketConfigs.get(msg.guild.id);
		if(!cfg) cfg = {category_id: "", archives_id: ""};

		var category = cfg.category_id != "" ? msg.guild.channels.find(c => c.id == cfg.category_id) : undefined;
		var archives = cfg.archives_id != "" ? msg.guild.channels.find(c => c.id == cfg.archives_id) : undefined;

		if(!args[0] || args[0] != "setup") return {embed: {
			title: "Ticket Config",
			fields: [
				{name: "Category ID", value: (category ? category.name.toLowerCase() : "*(not set)*")},
				{name: "Archive channel ID", value: (archives ? archives.name.toLowerCase() : "*(not set)*")}
			]
		}};

		var resp;
		
		await msg.channel.createMessage("Enter the category that tickets should be created in. This can be the category name or ID. You have 1 minute to do this\nNOTE: This category's permissions should only allow mods and I to see channels; I handle individual permissions for users!"+(category ? "\nType `skip` to keep the current value" : ""));
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60,maxMatches:1});
		if(!resp[0]) return "Action cancelled: timed out";
		if(!(category && resp[0].content.toLowerCase() == "skip")) category = await msg.guild.channels.find(c => (c.id == resp[0].content || c.name.toLowerCase() == resp[0].content.toLowerCase()) && c.type == 4);
		if(!category) return "Action cancelled: category not found";

		await msg.channel.createMessage("Enter the channel that archived tickets should be sent to. This can be the channel name, #mention, or ID. You have 1 minute to do this\nNOTE: This is not required. Type `skip` to skip it, and archives will be sent to your DMs instead");;
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60,maxMatches:1});
		if(!resp[0]) return "Action cancelled: timed out";
		if(resp[0].content.toLowerCase() != "skip") archives = await msg.guild.channels.find(c => (c.id == resp[0].content.replace(/<#>/g,"") || c.name.toLowerCase() == resp[0].content.toLowerCase()) && c.type == 0);
		if(!archives && resp[0].toLowerCase() != "skip") return "Action cancelled: category not found";

		try {
			if(cfg.category_id == "") await bot.stores.ticketConfigs.create(msg.guild.id, {category_id: category.id, archives_id: archives.id});
			else await bot.stores.ticketConfigs.update(msg.guild.id, {category_id: category.id, archives_id: archives.id});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Config set!";
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
		var config = await bot.stores.ticketConfigs.get(msg.guild.id);
		if(!config) config = {archives_id: null};
		
		var ticket = args[0] ? await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase()) : await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel";

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return "Couldn't find the channel associated with that ticket";

		var messages = await channel.getMessages(10000, null, ticket.first_message);
		if(!messages) return "Either that channel has no messages or I couldn't get them";

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
			if(!c) return "Couldn't find your archives channel; please reconfigure it";

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
				c.createMessage({embed},{file: Buffer.from([`Ticket opened: ${bot.formatTime(new Date(ticket.timestamp))}\r\n`,
				`Ticket opener: ${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})\r\n`,
				 `Users involved:\r\n${ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"].join("")+
				 data.reverse().join("\r\n------\r\n")), name: channel.name+".txt"})
			} catch(e) {
				console.log(e);
				return "Error while sending the archive:\n"+e.message+"\n\nAction aborted due to error";
			}
		} else {
			c = await bot.getDMChannel(msg.author.id);
			if(!c) return "Please make sure I can DM you";

			try {
				c.createMessage("Here is the archive:",{file: Buffer.from([`Ticket opened: ${bot.formatTime(new Date(ticket.timestamp))}\r\n`,
				`Ticket opener: ${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})\r\n`,
				 `Users involved:\r\n${ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"].join("")+data.reverse().join("\r\n------\r\n")),name: channel.name+".txt"})
			} catch(e) {
				console.log(e);
				return "Error while DMing the archive:\n"+e.message+"\n\nAction aborted due to error";
			}

		}

		try {
			await channel.delete("Ticket archived");
		} catch(e) {
			console.log(e);
			return "Error while deleting channel:\n"+e.message
		}

		try {
			await bot.stores.tickets.delete(msg.guild.id, ticket.hid);
		} catch(e) {
			(channel.id == msg.channel.id ? c : msg.channel).createMessage("Ticket archived, but could not be deleted from the database");
			return;
		}

		return;
	},
	permissions: ['manageMessages'],
	guildOnly: true
}

module.exports.subcommands.delete = {
	help: ()=> "Delete a support ticket",
	usage: ()=> [" - Deletes the current channel's ticket and associated channel",
				 " [hid] - Deletes the given ticket and its associated channel"],
	execute: async (bot, msg, args) => {
		var ticket = args[0] ? await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase()) : await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel";

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return "Couldn't find the channel associated with that ticket";

		var c = await bot.getDMChannel(msg.author.id);
		if(!c) return "Please make sure I can DM you";

		try {
			channel.delete("Ticket deleted");
			await bot.stores.tickets.delete(msg.guild.id, ticket.hid);
		} catch(e) {
			console.log(e);
			if(e.message) return "Error while deleting channel:\n"+e.message;
			else (channel.id == msg.channel.id ? c : msg.channel).createMessage("ERR: "+e);
			return;
		}

		return "Ticket successfully deleted!";
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
		if(!args[0]) return "Please provide users to add to the ticket";

		var ids;
		var ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		if(ticket) ids = args.slice(1).map(id => id.replace(/[<@!>]/g,""));
		else {
			ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
			ids = args.map(id => id.replace(/[<@!>]/g,""))
		}
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel";

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return "Couldn't get the channel associated with that ticket";

		if(ids.length > 10 || (ids.length + ticket.user_ids.length-1) > 10) return "Only to 10 users can be added to tickets via the command";
		ids = ticket.user_ids.concat(ids.filter(id => !ticket.user_ids.includes(id)));

		var members = msg.guild.members.filter(m => ids.includes(m.id)).map(m => m.id);
		if(!members || !members[0]) return "Please provide valid members to add to the ticket";

		try {
			for(var m of members) {
				await channel.editPermission(m, 1024, 0, "member");
			}
			await bot.stores.tickets.update(msg.guild.id, ticket.hid, {users: members});
		} catch(e) {
			console.log(e);
			return "ERR: "+(e.message || e);
		}

		return "Users added to ticket!";
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
		if(!args[0]) return "Please provide users to remove from the ticket";

		var ids;
		var ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		if(ticket) ids = args.slice(1).map(id => id.replace(/[<@!>]/g,""));
		else {
			ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
			ids = args.map(id => id.replace(/[<@!>]/g,""))
		}
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel";

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return "Couldn't get the channel associated with that ticket";

		ids = ids.filter(id => ticket.user_ids.includes(id) && id != ticket.opener_id);

		var members = msg.guild.members.filter(m => ids.includes(m.id)).map(m => m.id);
		if(!members || !members[0]) return "Please provide valid members to add to the ticket";

		try {
			for(var m of members) {
				await channel.editPermission(m, 0, 1024, "member");
			}
			await bot.stores.tickets.update(msg.guild.id, ticket.hid, {users: members});
		} catch(e) {
			console.log(e);
			return "ERR: "+(e.message || e);
		}

		return "Users removed from ticket!";
	},
	permissions: ['manageMessages'],
	guildOnly: true
}

module.exports.subcommands.bind = {
	help: ()=> "Bind the ticket starter reaction to a custom message",
	usage: ()=> [" <channel> [messageID] - Bind the reaction to a message. If no channel is given, tries to find the message in the current channel"],
	desc: ()=> "The channel can be a #mention, ID, or channel-name",
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide at least a message ID to bind the reaction to";

		var cfg = await bot.stores.ticketConfigs.get(msg.guild.id);
		if(!cfg) return "Please run `ha!ticket config setup` before doing this";

		var channel;
		var message;
		try {
			if(args[1]) channel = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g,"") || ch.name == args[0].toLowerCase());
			else channel = msg.channel;
			message = await bot.getMessage(channel.id, args[1]);

			if(!channel) return "Channel not found";
			if(!message) return "Message not found";

			message.addReaction("✅");
			await bot.stores.ticketPosts.create(msg.guild.id, message.channel.id, message.id);
		} catch(e) {
			console.log(e);
			return "ERR: "+(e.message || e);
		}

		return "Reaction bound!";
	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.unbind = {
	help: ()=> "Unbind the ticket starter reaction from a custom message",
	usage: ()=> [" [channel] [messageID] - Unbind the reaction from a message"],
	desc: ()=> "The channel can be a #mention, ID, or channel-name",
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide at least a message ID to bind the reaction to";

		var cfg = await bot.stores.ticketConfigs.get(msg.guild.id);
		if(!cfg) return "Please run `ha!ticket config setup` before doing this";

		var channel;
		var message;
		try {
			if(args[1]) channel = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g,"") || ch.name == args[0].toLowerCase());
			else channel = msg.channel;
			message = await bot.getMessage(channel.id, args[1]);

			if(!channel) return "Channel not found";
			if(!message) return "Message not found";

			message.removeReaction("✅");
			await bot.stores.ticketPosts.delete(msg.guild.id, message.id);
		} catch(e) {
			console.log(e);
			return "ERR: "+(e.message || e);
		}

		return "Reaction unbound!";	

	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.find = {
	help: ()=> "Find tickets opened by a specific user",
	usage: ()=> [" [user] - Find tickets from the given user"],
	desc: ()=> "User can be a @mention or ID. Does not include past tickets, as those are fully deleted from the database",
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a user to search for tickets from";

		var tickets = await bot.stores.tickets.getByUser(msg.guild.id, args[0].replace(/[<@!>]/g,""));
		if(!tickets || !tickets[0]) return "No tickets found from that user";

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
			title: `Support tickets from ${tickets[0].opener.username}#${tickets[0].opener.discriminator}`,
			description: `Total tickets: ${tickets.length}`
		});

		return embeds;
	}
}