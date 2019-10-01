module.exports = {
	help: ()=> "Denies a server listing",
	usage: ()=> [" [name] (new line) [reason] - Denies the server with the given reason (NOTE: reason must be on a new line)"],
	execute: async (bot, msg, args)=> {
		var conf = await bot.utils.getConfig(bot, msg.guild.id);
		var channel;
		var nargs = args.join(" ").split("\n");
		if(conf) channel = msg.guild.channels.find(ch => ch.id == conf.delist_channel) || message.channel;
		else channel = message.channel;

		channel.createMessage({embed: {
			title: "Server Denied",
			fields: [
				{name: "Server Name", value: nargs[0]},
				{name: "Delist Reason", value: nargs.slice(1).join("\n")}
			],
			thumbnail: {
				url: "https://cdn.discordapp.com/attachments/585890796671336451/585890824659795980/Plural_Hub_Ban_logo.png"
			},
			timestamp: new Date()
		}})
	},
	permissions: ["manageMessages"]
}