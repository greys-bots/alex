module.exports = {
	help: ()=> "Registers channel and reaction emoji for a server pinboard.",
	usage: ()=> [" add [chanName | chanID | #channel] [:emoji:] - Add channel and reaction config",
				" remove [chanName | chanID | #channel] - Remove channel config",
				" tolerance [number] - Set global pin tolerance",
				" tolerance - Reset global pin tolerance",
				" tolerance [channel] [number] - Set tolerance for a specific board",
				" tolerance [channel] - Reset tolerance for a specific board",
				" override  [channel] [(true|1)|(false|0)] - Sets moderator override"],
	desc: ()=> ["The moderator override determines if moderators can add things to the pinboard ",
				"without needing to hit the reaction tolerance, ",
				"'moderators' being those with the `manageMessages` permission",
				"\nTolerance refers to how many reactions are needed to add a message to the board. ",
				"By default, this number is 2. The global tolerance will be used for boards without ",
				"their own specified tolerance"].join(""),
	execute: async (bot, msg, args)=> {
		var config = await bot.stores.configs.get(msg.guild.id);
		if(!config) config = {starboard: 2};
		if(args[0]) {
			var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
			var board;
			if(channel) board = await bot.stores.starboards.get(msg.guild.id, channel.id);
			else board = await bot.stores.starboards.getByEmoji(msg.guild.id, args[0].replace(/[<>]/g,""));
			if(!board) return "Board not found";

			if(!channel) channel = msg.guild.channels.find(ch => ch.id == board.channel_id);
			if(!channel) {
				var scc = await bot.stores.starboards.delete(msg.guild.id, board.channel_id);
				if(scc) return "That starboard is not valid and has been deleted";
				else return "That starboard is not valid, but could not be deleted";
			}

			return {embed: {
				title: channel.name,
				fields: [
					{name: "Emoji", value: board.emoji.includes(":") ? `<${board.emoji}>` : board.emoji},
					{name: "Tolerance", value: board.tolerance ? board.tolerance : (config.starboard || 2)},
					{name: "Moderator Override", value: board.override ? "Yes" : "No"},
					{name: "Message Count", value: board.message_count}
				],
				color: parseInt("5555aa", 16)
			}};
		}

		var boards = await bot.stores.starboards.getAll(msg.guild.id);
		if(!boards || !boards[0]) return "No starboards registered for this server";
		
		var embeds = []
		var remove = [];

		for(var i = 0; i < boards.length; i++) {
			var channel = msg.guild.channels.find(ch => ch.id == boards[i].channel_id);
			if(channel) {
				embeds.push({embed: {
					title: `${channel.name} (${i+1}/${boards.length})`,
					fields: [
						{name: "Emoji", value: boards[i].emoji.includes(":") ? `<${boards[i].emoji}>` : boards[i].emoji},
						{name: "Tolerance", value: boards[i].tolerance ? boards[i].tolerance : (config.starboard || 2)},
						{name: "Moderator Override", value: boards[i].override ? "Yes" : "No"},
						{name: "Message Count", value: boards[i].message_count}
					],
					color: parseInt("5555aa", 16)
				}})
			} else remove.push({id: boards[i].channel_id});
		}

		if(remove[0]) {
			var err;
			for(var i = 0; i < remove.length; i++) {
				try {
					await bot.stores.starboards.delete(msg.guild.id, remove[i].id);
				} catch(e) {
					err = true;
				}
			}

			if(err) msg.channel.createMessage("Some invalid boards couldn't be removed from the database");
			else msg.channel.createMessage("Invalid starboards have been deleted!");
		}

		if(embeds[0]) return embeds;
		else return "No valid starboards exist";
	},
	subcommands: {},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["pinboard", "pb", "sb"]
}

module.exports.subcommands.add = {
	help: ()=> "Adds a channel to the server's starboard config",
	usage: ()=> [" [chanName | chanID | #channel] [:emoji:] - Adds channel and reaction config for the server."],
	desc: ()=> "The emoji can be a custom one.",
	execute: async (bot, msg, args)=> {
		if(!args[0] || !args[1]) return "Please provide a channel and an emoji";

		var chan = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g, "") || ch.name == args[0].toLowerCase());
		if(!chan) return "Channel not found";
		var emoji = args[1].replace(/[<>]/g,"");
		
		var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
		if(board) return "Board already registered for that channel";
		board = await bot.stores.starboards.getByEmoji(msg.guild.id, emoji);
		if(board) return "Board already registered with that emoji";

		try {
			await bot.stores.starboards.create(msg.guild.id, chan.id, emoji);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Starboard created!";
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["a","new"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a channel from the server's starboard config",
	usage: ()=> [" [chanName | chanID | #channel]- Removes the channel's pin config."],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return "Please provide a channel to remove the configs from";

		var chan = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g, "") || ch.name == args[0].toLowerCase());
		if(!chan) return "Channel not found";
		var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
		if(!board) return "Board not found";

		try {
			await bot.stores.starboards.delete(msg.guild.id, chan.id);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Starboard deleted!";
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["r","delete"]
}

module.exports.subcommands.pin = {
	help: ()=> "Takes the pins in the current channel and pins them in the pinboard",
	usage: ()=> [" [channel] - Processes pins in the current channel"],
	execute: async (bot, msg, args)=> {
		if(!args[0])
			return "Please provide a channel that has a starboard associated with it";

		var chan = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g, "") || ch.name == args[0].toLowerCase());
		if(!chan) return "Channel not found";
		var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
		if(!board) return "Board not found";
		var config = await bot.stores.configs.get(msg.guild.id);
		if(!config) config = {starboard: 2};
		var tolerance = board.tolerance || config.starboard || 2;

		try {
			var pins = await msg.channel.getPins();
		} catch(e) {
			return "ERR: "+e.message;
		}
		if(!pins || !pins[0]) return "This channel has no pins!";

		msg.channel.createMessage("Pinning! This might take a bit...");

		for(var i = 0; i < pins.length; i++) {
			var message = await bot.getMessage(pins[i].channel.id, pins[i].id);
			console.log(message.reactions);
			if(message.reactions[board.emoji.replace(/^:/, "")] &&
			  message.reactions[board.emoji.replace(/^:/, "")].me)
				continue;

			await message.addReaction(board.emoji.replace(/^:/, ""));
			var count = message.reactions[board.emoji.replace(/^:/, "")] ? message.reactions[board.emoji.replace(/^:/, "")].count+1 : 1;
			if(count < tolerance && (!board.override || !msg.guild.members.find(m => m.id == bot.user.id).permission.has("manageMessages")))
				await bot.stores.starPosts.create(msg.guild.id, chan.id, message, {emoji: board.emoji, count});
		}

		return "Messages pinned!";
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["pins","process"]
}

module.exports.subcommands.tolerance = {
	help: ()=> "Set the tolerance for boards (or globally)",
	usage: ()=> [" - Reset global tolerance",
				 " [number] - Set global tolerance",
				 " [channel] - Reset specific tolerance",
				 " [channel] [number] - Set specific tolerance"],
	execute: async (bot, msg, args) => {
		var config = await bot.stores.configs.get(msg.guild.id);
		if(!args[1]) {
			if(!args[0]) {
				if(!config || !config.starboard) return "No global tolerance registered for this server";
				else {
					var messsage = await msg.channel.createMessage(`Current global tolerance: ${config.starboard}\nWould you like to reset it?`);
					if(!bot.menus) bot.menus = {};
					bot.menus[message.id] = {
						user: msg.author.id,
						timeout: setTimeout(()=> {
							if(!bot.menus[message.id]) return;
							try {
								message.removeReactions();
							} catch(e) {
								console.log(e);
							}
							delete bot.menus[message.id];
						}, 900000),
						execute: async (bot, m, emoji) => {
							switch(emoji.name) {
								case "✅":
									await bot.stores.configs.update(msg.guild.id, {starboard: null});
									msg.channel.createMessage("Global tolerance reset!");
									break;
								case "❌":
									msg.channel.createMessage("Action cancelled");
									break;
							}
						}
					}

					return;
				}
			} else {
				var chan = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g, "") || ch.name == args[0].toLowerCase());
				if(!chan) { //assume this is setting the global tolerance
					if(parseInt(args[0]) == NaN || args[0].match(/\d{17,}/)) //Might've mistyped the channel
						return "Channel not found or is invalid";
					else {
						try {
							await bot.stores.configs.update(msg.guild.id, {starboard: parseInt(args[0])});
						} catch(e) {
							return "ERR: "+e;
						}

						return "Global tolerance set!";
					}
				} else {
					var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
					if(!board) return "No board found for that channel";

					try {
						await bot.stores.starboards.update(msg.guild.id, chan.id, {tolerance: null});
					} catch(e) {
						return "ERR: "+e;
					}

					return "Board tolerance reset!";
				}
			}
		} else {
			var chan = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g, "") || ch.name == args[0].toLowerCase());
			if(!chan) return "Channel not found";

			var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
			if(!board) "No board found for that channel";
			else {
				try {
					await bot.stores.starboards.update(msg.guild.id, chan.id, {tolerance: parseInt(args[1])});
				} catch(e) {
					return "ERR: "+e;
				}

				return "Board tolerance set!";
			}
		}
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["tol"]
}

module.exports.subcommands.override = {
	help: ()=> "Sets moderator override for adding items to the starboard",
	usage: ()=> [" [channel] [(true|1)|(false|0] - Sets the override"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a board and a value";
		
		var chan = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g, "") || ch.name == args[0].toLowerCase());
		if(!chan) return "Channel not found";
		var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
		if(!board) return "No board found for that channel";

		var val;
		switch(args[1]) {
			case "true":
			case "1":
			case "enable":
				val = true;
				break;
			case "false":
			case "0":
			case "disable":
				val = false;
				break;
		}

		try {
			await bot.stores.starboards.update(msg.guild.id, chan.id, {override: val});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Override set!";
	},
	permissions: ["manageGuild"],
	guildOnly: true
}