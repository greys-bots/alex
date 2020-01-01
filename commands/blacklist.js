module.exports = {
	help: ()=> "Blacklist a user from interacting with the bot",
	usage: ()=> [" - List the currently blacklisted users",
				 " add [id] [id] ... - Add users to the blacklist",
				 " remove [id] [id] ... - Remove users from the blacklist"],
	desc: ()=> "NOTE: For the add and remove commands, user IDs can be separated by a space or a new line",
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg || !cfg.blacklist || !cfg.blacklist[0]) return msg.channel.createMessage("No users have been blacklisted");

		var users = await bot.utils.verifyUsers(bot, cfg.blacklist);
		if(users.pass.length > 0) {
			if(users.pass.length > 20) {
				var embeds = await bot.utils.genEmbeds(bot, users.info, async dat => {
					return {name: `${dat.username}#${dat.discriminator}`, value: dat.id}
				}, {
					title: "Blacklisted Users"
				}, 20);

				var message = await msg.channel.createMessage(embeds[0])
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					index: 0,
					data: embeds,
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
						}
						delete bot.menus[message.id];
					}, 900000),
					execute: bot.utils.paginateEmbeds
				};
				["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
			} else {
				msg.channel.createMessage({embed: {
					title: "Blacklisted Users",
					fields: users.info.map(u => {
						return {name: `${u.username}#${u.discriminator}`, value: u.id}
					})
				}})
			}
		} else return msg.channel.createMessage("No users blacklisted or blacklist invalid");

		if(users.fail.length > 0) {
			cfg.blacklist = cfg.blacklist.filter(x => !users.fail.includes(x));
			var scc = await bot.utils.updateConfig(bot, msg.guild.id, {blacklist: cfg.blacklist})
			if(!scc) msg.channel.createMessage("Something went wrong while removing invalid users from the blacklist");
			else msg.channel.createMessage("Successfully removed invalid users from the blacklist")
		}
	},
	permissions: ["manageMessages"],
	subcommands: {},
	guildOnly: true
}

module.exports.subcommands.add = {
	help: ()=> "Add (a) user(s) to the blacklist",
	usage: ()=> [" [id] [id] ... - Add the given users to the blacklist"],
	desc: ()=> "NOTE: IDs can be separated by spaces or new lines",
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) cfg = {blacklist: []};
		if(!cfg.blacklist) cfg.blacklist = [];

		var ids = args.join(" ").split(/\s+/g);

		var users = await bot.utils.verifyUsers(bot, ids);

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {blacklist: cfg.blacklist.concat(users.pass)})
		if(!scc) return msg.channel.createMessage("Something went wrong");

		if(users.pass.length > 0) {
			msg.channel.createMessage({embed: {
				title: "Results",
				fields: [
				{name: "Users Added", value: users.info.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")},
				{name: "Users Not Added", value: users.fail.length > 0 ? users.fail.join("\n") : "None"}
				]
			}})
		} else return msg.channel.createMessage(`User${ids.length > 0 ? "s" : ""} provided are invalid`);

	},
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Remove (a) user(s) from the blacklist",
	usage: ()=> [" [id] [id] ... - Remove the given users from the blacklist"],
	desc: ()=> "NOTE: IDs can be separated by spaces or new lines",
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg || !cfg.blacklist || !cfg.blacklist[0]) return msg.channel.createMessage("No users have been blacklisted");
		
		var ids = args.join(" ").split(/\s+/g);

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {blacklist: cfg.blacklist.filter(x => !ids.includes(x))});
		if(!scc) msg.channel.createMessage("Something went wrong");
		else msg.channel.createMessage("Users removed from blacklist");
	},
	guildOnly: true
}