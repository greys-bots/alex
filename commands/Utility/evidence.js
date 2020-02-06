module.exports = {
	help: ()=> "Add, remove, view, and edit evidence for a ban",
	usage: ()=> [" [banID] - View evidence for a ban",
				 " add [banID] [evidence] - Add evidence to a ban log",
				 " remove [banID] - Remove evidence from a ban log",
				 " edit [banID] [new evidence] - Edit evidence for a ban",
				 " link [banID] [banID] - Links two bans together",
				 " unlink [banID] - Unlink a receipt from other receipts"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a ban ID");

		var log = await bot.utils.getBanLog(bot, args[0].toLowerCase(), msg.guild.id);
		if(!log || log == "deleted") return msg.channel.createMessage("Log does not exist");

		var receipt = await bot.utils.getReceipt(bot, args[0].toLowerCase(), msg.guild.id);
		if(!receipt) return msg.channel.createMessage("No receipts registered for that ban");

		var users = await bot.utils.verifyUsers(bot, log.embed.fields[1].value.split("\n"));

		msg.channel.createMessage({embed: {
			title: "Ban Receipt",
			description: receipt.message,
			fields: [
				{name: "Users Banned", value: users.info.map(u => `${u.username}#${u.discriminator} (${u.id})`).concat(users.fail.map(u => `${u} - Member deleted?`)).join("\n")},
				{name: "Reason", value: log.embed.fields[2].value}
			]
		}})
	},
	subcommands: {},
	alias: ['receipt', 'receipts']
}

module.exports.subcommands.add = {
	help: ()=> "Add a receipt to a ban log",
	usage: ()=> [" [banID] [receipt message] - Add receipt to a ban"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a ban ID and receipt message");

		var log = await bot.utils.getBanLog(bot, args[0].toLowerCase(), msg.guild.id);
		if(!log || log == "deleted") return msg.channel.createMessage("Log does not exist");

		var receipt = await bot.utils.getReceipt(bot, args[0].toLowerCase(), msg.guild.id);
		if(receipt) return msg.channel.createMessage("Receipt already registered for that ban; use `hub!receipt edit` to edit it");

		var scc = await bot.utils.addReceipt(bot, args[0].toLowerCase(), msg.guild.id, args.slice(1).join(" "));
		if(scc) msg.channel.createMessage("Receipt added!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	permissions: ['manageMessages'],
	alias: ["create", "new"]
}

module.exports.subcommands.remove = {
	help: ()=> "Remove a receipt from a ban log",
	usage: ()=> [" [banID] - Remove receipt from a ban"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a ban ID");

		var log = await bot.utils.getBanLog(bot, args[0].toLowerCase(), msg.guild.id);
		if(!log || log == "deleted") return msg.channel.createMessage("Log does not exist");

		var receipt = await bot.utils.getReceipt(bot, args[0].toLowerCase(), msg.guild.id);
		if(!receipt) return msg.channel.createMessage("No receipts registered for that ban");

		var scc = await bot.utils.deleteReceipt(bot, args[0].toLowerCase(), msg.guild.id);
		if(scc) msg.channel.createMessage("Receipt removed!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	permissions: ['manageMessages'],
	alias: ["delete"]
}

module.exports.subcommands.edit = {
	help: ()=> "Edits a receipt for a ban log",
	usage: ()=> [" [banID] [receipt message] - Edit receipt for a ban"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a ban ID and receipt message");

		var log = await bot.utils.getBanLog(bot, args[0].toLowerCase(), msg.guild.id);
		if(!log || log == "deleted") return msg.channel.createMessage("Log does not exist");

		var receipt = await bot.utils.getReceipt(bot, args[0].toLowerCase(), msg.guild.id);
		if(!receipt) return msg.channel.createMessage("No receipts registered for that ban; use `hub!receipt add` to add one");

		if(receipt.link) {
			var links = await bot.utils.getLinkedReceipts(bot, msg.guild.id, receipt.link);
			try {
				var scc = await Promise.all(links.map(async r => {
					await bot.utils.editReceipt(bot, r.hid, msg.guild.id, "message", args.slice(1).join(" "));
				}));
			} catch(e) {
				console.log(e)
				return msg.channel.createMessage("ERR:\n"+e.message);
			}

			if(scc.find(r => r == false)) msg.channel.createMessage("At least one receipt could not be edited");
			else msg.channel.createMessage("Receipt edited, along with all linked receipts!");
			
		} else {
			var scc = await bot.utils.editReceipt(bot, receipt.hid, msg.guild.id, "message", args.slice(1).join(" "));
			if(scc) msg.channel.createMessage("Receipt edited!");
			else msg.channel.createMessage("Something went wrong");
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
		if(!args[1]) return msg.channel.createMessage("Please provide the ban ID and the ID of the ban to link to, in that order");

		var log = await bot.utils.getBanLog(bot, args[0].toLowerCase(), msg.guild.id);
		if(!log || log == "deleted") return msg.channel.createMessage("ID 1 is not a valid log ID");
		var log2 = await bot.utils.getBanLog(bot, args[1].toLowerCase(), msg.guild.id);
		if(!log2 || log2 == "deleted") return msg.channel.createMessage("ID 2 is not a valid log ID");

		var receipt = await bot.utils.getReceipt(bot, args[0].toLowerCase(), msg.guild.id);
		var receipt2 = await bot.utils.getReceipt(bot, args[1].toLowerCase(), msg.guild.id);

		if(!receipt && !receipt2) return msg.channel.createMessage("No receipt found for either ban. Please use the `hub!receipt add` command to add a receipt first");
		if(receipt.link && receipt2.link) return msg.channel.createMessage("Both receipts already have links! Please use the `hub!receipt unlink` command to unlink one first")

		var oreceipt;

		if(receipt && receipt2) {
			await msg.channel.createMessage([
				"There are receipts registered for both logs. Which would you like to keep?",
				"```yaml",
				"1 - Log for "+args[0],
				"2 - Log for "+args[1],
				"```"
			].join("\n"))
			var response = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 60000});
			if(!response[0]) return msg.channel.createMessage("ERR: timed out. Aborting command");
			if(response[0].content == "1") oreceipt = receipt;
			else if(response[0].content == "2") oreceipt = receipt2;
			else return msg.channel.createMessage("ERR: invalid input. Aborting command");
		} else oreceipt = receipt || receipt2;

		var scc = bot.utils.linkReceipts(bot, msg.guild.id, args[0], args[1], oreceipt.message);
		if(scc) msg.channel.createMessage(`Receipts linked! You can now use \`hub!receipt edit ${args[1]} [new receipt]\` to edit them simultaneously`);
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.unlink = {
	help: ()=> "Unlink a receipt from another receipt or all its current links",
	usage: ()=> [" [hid] - Unlinks receipt from all current linked receipts"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a receipt to unlink")
		
		var log = await bot.utils.getBanLog(bot, args[0].toLowerCase(), msg.guild.id);
		if(!log || log == "deleted") return msg.channel.createMessage("That is not a valid log ID");

		var receipt = await bot.utils.getReceipt(bot, args[0].toLowerCase(), msg.guild.id);

		if(!receipt) return msg.channel.createMessage("No receipt found for this ban. Nothing to unlink");
		if(!receipt.link) return msg.channel.createMessage("This receipt has no links. Nothing to unlink");

		var links = await bot.utils.getLinkedReceipts(bot, msg.guild.id, receipt.link);
		if(links.length == 2) await bot.utils.editReceipt(bot, links.find(l => l.hid != receipt.hid).hid, msg.guild.id, "link", "")

		var scc = await bot.utils.editReceipt(bot, receipt.hid, msg.guild.id, "link", "");
		if(scc) msg.channel.createMessage("Receipt unlinked! Note that it will still have the same message as when it was linked until it's been edited");
		else msg.channel.createMessage("Something went wrong");
	},
	permission: ["manageMessages"],
	guildOnly: true
}