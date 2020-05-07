module.exports = {
	help: ()=> "Add, remove, view, and edit evidence for a ban",
	usage: ()=> [" [banID] - View evidence for a ban",
				 " add [banID] [evidence] - Add evidence to a ban log",
				 " remove [banID] - Remove evidence from a ban log",
				 " edit [banID] [new evidence] - Edit evidence for a ban",
				 " link [banID] [banID] - Links two bans together",
				 " unlink [banID] - Unlink a receipt from other receipts"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a ban ID";

		var log = await bot.stores.banLogs.get(msg.guild.id, args[0].toLowerCase());
		if(!log || log == "deleted") return "Log does not exist";
		if(!log.receipt) return "No receipts registered for that ban";

		var users = await bot.utils.verifyUsers(bot, log.embed.fields[1].value.split("\n"));

		return {embed: {
			title: "Ban Receipt",
			description: log.receipt.message,
			fields: [
				{name: "Users Banned", value: users.info.map(u => `${u.username}#${u.discriminator} (${u.id})`).concat(users.fail.map(u => `${u} - Member deleted?`)).join("\n")},
				{name: "Reason", value: log.embed.fields[2].value}
			]
		}};
	},
	subcommands: {},
	alias: ['receipt', 'receipts']
}

module.exports.subcommands.add = {
	help: ()=> "Add a receipt to a ban log",
	usage: ()=> [" [banID] [receipt message] - Add receipt to a ban"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a ban ID and receipt message";

		var log = await bot.stores.banLogs.get(msg.guild.id, args[0].toLowerCase());
		if(!log || log == "deleted") return "Log does not exist";
		if(log.receipt) return "Receipt already registered for that ban; use `hub!receipt edit` to edit it";

		try {
			await bot.stores.receipts.create(msg.guild.id, args[0].toLowerCase(), {message: args.slice(1).join(" ")});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Receipt added!";
	},
	guildOnly: true,
	permissions: ['manageMessages'],
	alias: ["create", "new"]
}

module.exports.subcommands.remove = {
	help: ()=> "Remove a receipt from a ban log",
	usage: ()=> [" [banID] - Remove receipt from a ban"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a ban ID";

		var log = await bot.stores.banLogs.get(msg.guild.id, args[0].toLowerCase());
		if(!log || log == "deleted") return "Log does not exist";
		if(!log.receipt) return "No receipts registered for that ban";

		try {
			await bot.stores.receipts.delete(msg.guild.id, args[0].toLowerCase());
		} catch(e) {
			return "ERR: "+e;
		}
		
		return "Receipt removed!";
	},
	guildOnly: true,
	permissions: ['manageMessages'],
	alias: ["delete"]
}

module.exports.subcommands.edit = {
	help: ()=> "Edits a receipt for a ban log",
	usage: ()=> [" [banID] [receipt message] - Edit receipt for a ban"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a ban ID and receipt message";

		var log = await bot.stores.banLogs.get(msg.guild.id, args[0].toLowerCase());
		if(!log || log == "deleted") return "Log does not exist";
		if(!log.receipt) return "No receipts registered for that ban; use `hub!receipt add` to add one";

		if(log.receipt.link) {
			var links = await bot.stores.receipts.getLinked(msg.guild.id, log.receipt.link);
			try {
				for(var r of links) {
					await bot.stores.receipts.update(msg.guild.id, r.hid, {message: args.slice(1).join(" ")});
				}
			} catch(e) {
				return "ERR: "+e;
			}

			return "Receipt edited, along with all linked receipts!";
		} else {
			try {
				await bot.stores.receipts.update(log.receipt.hid, msg.guild.id, {message: args.slice(1).join(" ")});
			} catch(e) {
				return "ERR: "+e;
			}

			return "Receipt edited!";
		}
	},
	guildOnly: true,
	permissions: ['manageMessages']
}

module.exports.subcommands.link = {
	help: ()=> "Link two ban logs together, making them share receipts",
	usage: ()=> [" [ban id] [ban id to link to] - Links the two bans"],
	desc: ()=> ["This command links ban logs so that any updates to one receipt will happen across ",
				"other receipts as well. If a ban log already has a receipt attached, you'll be asked ",
				"which to keep"].join(""), 
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide the ban ID and the ID of the ban to link to, in that order";

		var log = await bot.stores.banLogs.get(msg.guild.id, args[0].toLowerCase());
		if(!log || log == "deleted") return "ID 1 is not a valid log ID";
		var log2 = await bot.stores.banLogs.get(msg.guild.id, args[1].toLowerCase());
		if(!log2 || log2 == "deleted") return "ID 2 is not a valid log ID";
		if(!log.receipt && !log2.receipt) return "No receipt found for either ban. Please use the `hub!receipt add` command to add a receipt first";
		if(log.receipt.link && log2.receipt.link) return "Both receipts already have links! Please use the `hub!receipt unlink` command to unlink one first";

		var oreceipt;

		if(log.receipt && log2.receipt) {
			await msg.channel.createMessage([
				"There are receipts registered for both logs. Which would you like to keep?",
				"```yaml",
				"1 - Log for "+args[0],
				"2 - Log for "+args[1],
				"```"
			].join("\n"))
			var response = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 60000});
			if(!response[0]) return "ERR: timed out. Aborting command";
			if(response[0].content == "1") oreceipt = log.receipt;
			else if(response[0].content == "2") oreceipt = log2.receipt;
			else return "ERR: invalid input. Aborting command";
		} else oreceipt = log.receipt || log2.receipt;

		try {
			await bot.stores.receipts.link(msg.guild.id, log.hid, log2.hid, oreceipt.message);
		} catch(e) {
			return "ERR: "+e;
		}

		return `Receipts linked! You can now use \`hub!receipt edit ${args[1]} [new receipt]\` to edit them simultaneously`;
	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.unlink = {
	help: ()=> "Unlink a receipt from another receipt or all its current links",
	usage: ()=> [" [hid] - Unlinks receipt from all current linked receipts"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a receipt to unlink"
		
		var log = await bot.stores.banLogs.get(args[0].toLowerCase(), msg.guild.id);
		if(!log || log == "deleted") return "That is not a valid log ID";
		if(!log.receipt) return "No receipt found for this ban. Nothing to unlink";
		if(!log.receipt.link) return "This receipt has no links. Nothing to unlink";

		try {
			var links = await bot.stores.receipts.getLinked(msg.guild.id, receipt.link);
			if(links.length == 2) await bot.stores.receipts.update(msg.guild.id, links.find(l => l.hid != receipt.hid).hid, {link: ""});
			await bot.utils.editReceipt(msg.guild.id, receipt.hid, {link: ""});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Receipt unlinked!";
	},
	permission: ["manageMessages"],
	guildOnly: true
}