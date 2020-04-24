module.exports = {
	help: ()=> "Blacklist a user from interacting with the bot",
	usage: ()=> [" - List the currently blacklisted users",
				 " add [id] [id] ... - Add users to the blacklist",
				 " remove [id] [id] ... - Remove users from the blacklist"],
	desc: ()=> "NOTE: For the add and remove commands, user IDs can be separated by a space or a new line",
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg || !cfg.blacklist || !cfg.blacklist[0]) return "No users have been blacklisted";

		var users = await bot.utils.verifyUsers(bot, cfg.blacklist);
		var embeds = await bot.utils.genEmbeds(bot, users.info, async dat => {
			return {name: `${dat.username}#${dat.discriminator}`, value: dat.id}
		}, {
			title: "Blacklisted Users"
		}, 20);

		if(users.fail.length > 0) {
			cfg.blacklist = cfg.blacklist.filter(x => !users.fail.includes(x));
			var scc = await bot.stores.configs.update(msg.guild.id, {blacklist: cfg.blacklist})
			if(!scc) msg.channel.createMessage("Something went wrong while removing invalid users from the blacklist");
			else msg.channel.createMessage("Successfully removed invalid users from the blacklist")
		}

		return embeds;
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
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg) cfg = {blacklist: []};
		if(!cfg.blacklist) cfg.blacklist = [];

		var ids = args.join(" ").split(/\s+/g);

		var users = await bot.utils.verifyUsers(bot, ids);

		try {
			await bot.stores.configs.update(msg.guild.id, {blacklist: cfg.blacklist.concat(users.pass)})
		} catch(e) {
			return "ERR: "+e;
		}

		if(users.pass.length > 0) {
			return {embed: {
				title: "Results",
				fields: [
				{name: "Users Added", value: users.info.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")},
				{name: "Users Not Added", value: users.fail.length > 0 ? users.fail.join("\n") : "None"}
				]
			}}
		} else return `User${ids.length != 1 ? "s provided are" : " provided is"} invalid`;
	},
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Remove (a) user(s) from the blacklist",
	usage: ()=> [" [id] [id] ... - Remove the given users from the blacklist"],
	desc: ()=> "NOTE: IDs can be separated by spaces or new lines",
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg || !cfg.blacklist || !cfg.blacklist[0]) return "No users have been blacklisted";
		
		var ids = args.join(" ").split(/\s+/g);

		try {
			await bot.stores.configs.update(msg.guild.id, {blacklist: cfg.blacklist.filter(x => !ids.includes(x))});
		} catch(e) {
			return "ERR: "+e;
		}
		
		return "Users removed from blacklist";
	},
	guildOnly: true
}