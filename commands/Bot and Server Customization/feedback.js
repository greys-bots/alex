module.exports = {
	help: ()=> "Send feedback to a server",
	usage: ()=> [' [serverID] - Initiate feedback menu',
				 ' channel [channel] - Set the channel for feedback to go to',
				 ' anon [1|0] - Set whether anon messages are allowed. Default: true',
				 ' config - View the current feedback config',
				 ' reply [id] [message] - Reply to feedback',
				 ' delete [id] - Delete a feedback message (use * to delete all)',
				 ' list - List all feedback posts',
				 ' view [id] - View an individual ticket',
				 ' find [query] - Search through tickets to find ones matching the given query'],
	desc: ()=> "A server's ID can be found by turning on developer mode and right clicking on a server (desktop) or opening a server's menu (mobile)",
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a server ID.";
		var cfg = await bot.stores.feedbackConfigs.get(args[0]);
		if(!cfg || !cfg.channel_id) return "That server is not currently accepting feedback";

		var embed, anon = false;
		await msg.channel.createMessage("Please enter your message below. You have 5 minutes to do this.");
		console.log(msg.channel);
		var messages = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60*5,maxMatches:1});
		if(messages[0]) embed = {title: "Feedback", description: messages[0].content};
		else return "Action cancelled: timed out";
		if(cfg.anon) {
			await msg.channel.createMessage("Would you like this to be anonymous? (y/n)\nYou have 30 seconds to answer, otherwise it will not be anonymous");
			messages = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:30000,maxMatches:1});
			if(messages[0] && ["y","yes","true","1"].includes(messages[0].content.toLowerCase())) anon = true;
		}
		if(!anon) embed.author = {name: `${msg.author.username}#${msg.author.discriminator}`, icon_url: msg.author.avatarURL};
		else embed.author = {name: "Anonymous", icon_url: "https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png"};

		var code = bot.utils.genCode(bot.chars);
		embed.timestamp = new Date();
		embed.footer = {text: `ID: ${code}`};
		await msg.channel.createMessage({content: "Is this okay? (y/n)", embed: embed});

		messages = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:30000,maxMatches:1});
		if(messages[0]) {
			if(["y","yes","true","1"].includes(messages[0].content.toLowerCase())) {
				bot.createMessage(cfg.channel_id, {embed: embed});
				bot.stores.feedbackTickets.create(code, args[0], msg.author.id, embed.description, anon);
				return `Sent!`;
			} else return "Action cancelled";
		} else return "Action cancelled: timed out";
	},
	subcommands: {},
	alias: ['fb']
}

module.exports.subcommands.channel = {
	help: ()=> "Sets the channel where feedback goes, enabling feedback",
	usage: ()=> [" [channel] - Sets the channel",
				 " - Resets the channel (disabled feedback"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a channel";
		var cfg = await bot.stores.feedbackConfigs.get(args[0]);
		var feedback;
		if(cfg) feedback = cfg;
		else feedback = {};

		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[0]);
		if(!channel) return 'Channel not found :(';
		feedback.channel_id = channel.id;

		try {
			if(cfg) scc = await bot.stores.feedbackConfigs.update(msg.guild.id, feedback);
			else scc = await bot.stores.feedbackConfigs.create(msg.guild.id, feedback);
		} catch(e) {
			return e;
		}
		
		return "Channel updated!";
	},
	guildOnly: true,
	permissions: ['manageGuild'],
	alias: ['ch', 'chan']
}

module.exports.subcommands.anon = {
	help: ()=> "Sets whether anon feedback is allowed or not",
	usage: ()=> [" [on | off] - Sets the anon value"],
	desc: ()=> "Other available values:\nON: 1, enable, true\nOFF: 0, disable, false",
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a value";
		var cfg = await bot.stores.feedbackConfigs.get(msg.guild.id);
		console.log(cfg);
		var feedback;
		if(cfg) feedback = cfg;
		else feedback = {};
		delete feedback.id;
		
		switch(args[0].toLowerCase()) {
			case "1":
			case "on":
			case "true":
			case "enable":
				feedback.anon = true;
				break;
			case "0":
			case "off":
			case "false":
			case "disable":
				feedback.anon = false;
				break;
			default:
				return "That value is invalid :(";
				break;
		}

		try {
			if(cfg) scc = await bot.stores.feedbackConfigs.update(msg.guild.id, feedback);
			else scc = await bot.stores.feedbackConfigs.create(msg.guild.id, feedback);
		} catch(e) {
			return e;
		}
		
		return "Anon updated!";
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.config = {
	help: ()=> "Views current config",
	usage: ()=> [" - Views server's feedback config"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.feedbackConfigs.get(msg.guild.id)
		if(!cfg) return "No config registered for this server";
		var channel = cfg.channel_id ? msg.guild.channels.find(c => c.id == cfg.channel_id) : undefined;
		return {embed: {
			title: "Feedback Config",
			fields: [
			{name: "Channel", value: channel ? channel.mention : "*(not set)*"},
			{name: "Anon", value: cfg.anon ? "True" : "False"}
			]
		}};
	},
	guildOnly: true
}

module.exports.subcommands.reply = {
	help: ()=> "Reply to a ticket",
	usage: ()=> [" [hid] [message] - Send a message to a ticket's creator"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a ticket and a message";

		var ticket = await bot.stores.feedbackTickets.get(msg.guild.id, args[0]);
		if(!ticket) return 'Ticket not found';

		var channel = await bot.getDMChannel(ticket.sender_id);
		if(!channel) return "Can't deliver message: unable to get user's DM channel";

		try {
			channel.createMessage({embed: {
				title: "Feedback Reply",
				description: args.slice(1).join(" "),
				timestamp: new Date(),
				footer: {
					text: `ID: ${ticket.hid}`
				}
			}})
		} catch(e) {
			console.log(e);
			return 'Reply failed: '+e.message;
		}

		return 'Reply sent!';
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.delete = {
	help: ()=> "Delete one or all feedback ticket(s)",
	usage: ()=> [" [hid] - Deletes the given ticket",
				 " * - Deletes all registered tickets"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return 'Please provide a ticket to delete';
		if(args[0] == "*") {
			var scc = await bot.stores.feedbackTickets.deleteAll(msg.guild.id);
			if(scc) return 'Tickets deleted!';
			else return 'Something went wrong';
		} else {
			var scc = await  bot.stores.feedbackTickets.delete(msg.guild.id, args[0]);
			if(scc) return 'Ticket deleted!';
			else return 'Something went wrong';
		}
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.list = {
	help: ()=> "Lists all feedback tickets",
	usage: ()=> [" - Lists all indexed tickets for the server"],
	execute: async (bot, msg, args) => {
		var tickets = await bot.stores.feedbackTickets.getAll(msg.guild.id);
		if(!tickets || !tickets[0]) return 'No tickets registered for this server';

		for(var ticket of tickets) {
			try {
				var user = await bot.utils.fetchUser(bot, ticket.sender_id);
			} catch(e) {
				return `ERR on ticket ${ticket.hid}: ${e}`;
			}
			if(user && !ticket.anon) ticket.user = {name: `${user.username}#${user.discriminator}`, icon_url: user.avatarURL};
			else if(ticket.anon) ticket.user = {name: "Anonymous", icon_url: "https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png"};
			else ticket.user = {name: "*(User not cached)*", icon_url: null};
		}

		var embeds = tickets.map((t,i) => {
			return {embed: {
				title: `Ticket ${t.hid} (${i+1}/${tickets.length})`,
				description: t.message,
				author: t.user,
				footer: {
					text: `ID: ${t.hid}`
				}
			}}
		})

		return embeds;
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.view = {
	help: ()=> "Views an individual ticket",
	usage: ()=> [" [id] - Views a ticket with the given ID"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a ticket ID.";
		var ticket = await bot.stores.feedbackTickets.get( msg.guild.id, args[0]);
		if(!ticket) return "That ticket does not exist";

		var user = await bot.utils.fetchUser(bot, ticket.sender_id);

		if(user && !ticket.anon) ticket.user = {name: `${user.username}#${user.discriminator}`, icon_url: user.avatarURL};
		else if(ticket.anon) ticket.user = {name: "Anonymous", icon_url: "https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png"};
		else ticket.user = {name: "*(User not cached)*", icon_url: null};
		
		return {embed: {
			title: "Feedback",
			description: ticket.message,
			author: ticket.user,
			footer: {
				text: `ID: ${t.hid}`
			}
		}};
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.find = {
	help: ()=> "Find tickets matching a specific query",
	usage: ()=> [" [words to search] - Find tickets with certain words",
				 " from:[userID] - Find tickets from a certain user (does not list anonymous ones)",
				 " from:[userID] [words to search] - Find tickets from a certain user that also contain certain words (also does not list anonymous ones)"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a search query.";
		var query = {};
		var tickets;
		if(args[0].toLowerCase().startsWith('from:')) {
			query.user = args[0].toLowerCase().replace('from:','');
			query.message = args[1] ? args.slice(1).join(" ").toLowerCase() : undefined;
		} else {
			query.message = args[0] ? args.join(" ").toLowerCase() : undefined;
		}
		if(!query.user && !query.message) return "Please provide a search query";

		var tickets = await bot.stores.feedbackTickets.search(msg.guild.id, query)

		if(!tickets || !tickets[0]) return 'No tickets found matching that query';

		for(var ticket of tickets) {
			try {
				var user = await bot.utils.fetchUser(bot, ticket.sender_id);
			} catch(e) {
				return `ERR on ticket ${ticket.hid}: ${e}`;
			}
			if(user && !ticket.anon) ticket.user = `${user.username}#${user.discriminator}`;
			else if(ticket.anon) ticket.user = "Anonymous";
			else ticket.user = "*(User not cached)*";
		}

		var embeds = tickets.map((t,i) => {
			return {embed: {
				title: `Ticket ${ticket.hid} (${i+1}/${tickets.length})`,
				description: t.message,
				author: {
					username: ticket.user
				},
				footer: {
					text: `ID: ${t.hid}`
				}
			}}
		})
	},
	alias: ['search'],
	guildOnly: true,
	permissions: ['manageGuild']
}