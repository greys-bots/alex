module.exports = {
	help: ()=> "Denies a server listing",
	usage: ()=> [" [name] (new line) [reason] - Denies the server with the given reason (NOTE: reason must be on a new line)"],
	execute: async (bot, msg, args)=> {
		var conf = await bot.utils.getConfig(bot, msg.guild.id);
		var channel;
		var name = args.join(" ").split("\n")[0];
		var reason = args.join(" ").split("\n").slice(1).join("\n") || "(no reason given)";
		var date = new Date();

		Object.keys(bot.logVars).forEach(lv => {
			reason = reason.replace(lv, eval("`"+bot.logVars[lv].replace("guild.name","name")+"`","g"));
		})

		if(conf) channel = msg.guild.channels.find(ch => ch.id == conf.delist_channel) || message.channel;
		else channel = message.channel;

		var message;
		var code = bot.utils.genCode(bot.chars);
		try {
			message = await channel.createMessage({embed: {
				title: "Server Denied",
				fields: [
					{name: "Server Name", value: name},
					{name: "Denial Reason", value: reason}
				],
				thumbnail: {
					url: "https://cdn.discordapp.com/attachments/585890796671336451/585890824659795980/Plural_Hub_Ban_logo.png"
				},
				timestamp: date,
				footer: {
					text: code
				}
			}})
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Something went wrong");
		}
		
		var scc = await bot.utils.addListingLog(bot, code, msg.guild.id, message.channel.id, message.id, name, reason, date, 1);
		if(scc) msg.channel.createMessage("Server denied! Log ID: "+code);
		else msg.channel.createMessage("Something went wrong while adding the listing log");
	},
	permissions: ["manageMessages"],
	subcommands: {},
	guildOnly: true
}

module.exports.subcommands.edit = {
	help: ()=> "Edit a denial message",
	usage: ()=> [" [logID] [new message] - Edits the message on a denial log"],
	desc: ()=> "You can also use `hub!delist edit [id] [reason]` to edit denial logs",
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a log ID and a reason");
		var log = await bot.utils.getListingLog(bot, args[0].toLowerCase(), msg.guild.id);
		var reason = args.slice(1).join(" ");

		if(!log) return msg.channel.createMessage("Log not found");
		else if(log == "deleted") return msg.channel.createMessage("Log was deleted due to the message no longer existing");

		try {
			log.embed.fields[1].value = reason;
			bot.editMessage(log.channel_id, log.message_id, {embed: log.embed});
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Something went wrong")
		}
		
		var scc = await bot.utils.updateListingLog(bot, log.hid, msg.guild.id, {reason: reason})
		if(scc) msg.channel.createMessage("Log edited!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}