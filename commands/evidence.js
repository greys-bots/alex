module.exports = {
	help: ()=> "Add, remove, view, and edit evidence for a ban",
	usage: ()=> [" [banID] - View evidence for a ban",
				 " add [banID] [evidence] - Add evidence to a ban log",
				 " remove [banID] - Remove evidence from a ban log",
				 " edit [banID] [new evidence] - Edit evidence for a ban"],
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
	permissions: ['manageMessages'],
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
	}
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
	}
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

		var scc = await bot.utils.editReceipt(bot, args[0].toLowerCase(), msg.guild.id, args.slice(1).join(" "));
		if(scc) msg.channel.createMessage("Receipt edited!");
		else msg.channel.createMessage("Something went wrong");
	}
}