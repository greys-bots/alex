module.exports = {
	help: ()=> "Prunes messages in a channel",
	usage: ()=> [" <number> - Deletes [number] messages from the current channel, or 100 messages if not specified"],
	execute: async (bot, msg, args)=>{
		var del = (args[0] != NaN ? Number(args[0]) : 100);
		try {
			var n = await msg.channel.purge(del);
			var message = await msg.channel.createMessage(n + " messages deleted!")
			setTimeout(()=>{
				message.delete();
			},5000)
		} catch(e) {
			console.log(e);
			return "ERR: "+e.message;
		}

		return;
	},
	subcommands: {},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["purge"],
	module: "admin"
}

module.exports.subcommands.safe = {
	help: ()=> "Prunes messages in a channel, unless pinned",
	usage: ()=> [" <number> - Deletes [num] messages, or 100 if not specified. Ignores pinned messages"],
	execute: async (bot, msg, args)=>{
		var del = (args[0] != NaN ? Number(args[0]) : 100);
		try {
			var n = await msg.channel.purge(del, (m) => !m.pinned);
			var message = await msg.channel.createMessage(n + " messages deleted.")
			setTimeout(()=>{
				message.delete();
			},5000)
		} catch(e) {
			console.log(e);
			return "ERR: "+e.message;
		}

		return;
	},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["--s","-s","s"]
}

module.exports.subcommands.archive = {
	help: ()=> "Prunes messages in a channel and also archives them",
	usage: ()=> [" <number> - Deletes [num] messages, or 100 if not specified. Archives the messages as well"],
	execute: (bot, msg, args)=> {
		var del = (args[0] ? args[0] : 100);

		bot.commands.get("archive").execute(bot, msg, [del]);
		bot.commands.get("prune").execute(bot, msg, [del])
	},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["--a","-a","a"]
}