module.exports = {
	help: ()=> "Denies a server listing",
	usage: ()=> [" [name] (new line) [reason] - Denies the server with the given reason (NOTE: reason must be on a new line)"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return "Please provide a server to deny";
		var conf = await bot.stores.configs.get(msg.guild.id);
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
			await bot.stores.listingLogs.create(msg.guild.id, code, {
				channel_id: message.channel.id,
				message_id: message.id,
				server_name: name,
				reason,
				date,
				type: 1
			});
		} catch(e) {
			console.log(e);
			return "ERR: "+(e.message || e);
		}
		
		return "Server denied! Log ID: "+code;
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
		if(!args[1]) return "Please provide a log ID and a reason";
		var log = await bot.stores.listingLogs.get(msg.guild.id, args[0].toLowerCase());
		var reason = args.slice(1).join(" ");

		if(!log || log == "deleted") return "Log not found";

		try {
			await bot.stores.listingLogs.update(msg.guild.id, log.hid, {reason})
		} catch(e) {
			console.log(e);
			return "ERR: "+e;
		}
		
		return "Log edited!";
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}