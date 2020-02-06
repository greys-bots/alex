module.exports = {
	help: ()=> "Sets configs for the server.",
	usage: ()=> [" banlog [channel] - Sets banlog channel for the server",
				 " banmsg [message] - Sets ban message for the server (this is what users are DM'd upon being banned, as long as they were in the server first)",
				 " delist [channe] - Sets delist/deny channel for the server",
				 " reprole [role] - Sets representative role for the server"],
	desc: ()=> ["Channels can be channel-names, #mentions, or IDs. The role can be a role name, @mention, or ID",
				"Available vars for ban messages:",
				"$REASON - The reason a user was banned",
				"$SERVER.NAME - Your server's name"].join("\n"),
	execute: async (bot, msg, args)=> {
		var conf = await bot.utils.getConfig(bot, msg.guild.id);
		var textconf = "";
		if(!conf) return msg.channel.createMessage('Config not found.');

		var bchan = conf.banlog_channel ? msg.guild.channels.find(c => c.id == conf.banlog_channel) : undefined;
		var rrole = conf.reprole ?  msg.guild.roles.find(rl => rl.id == conf.reprole) : undefined;
		var dchan = conf.delist_channel ? msg.guild.channels.find(ch => ch.id == conf.delist_channel) : undefined;

		msg.channel.createMessage({embed: {
			title: "Server Config",
			fields: [
				{name: "Ban Log Channel", value: bchan ? bchan.mention : "(not set)"},
				{name: "Ban Message", value: conf.ban_message ? conf.ban_message : "(not set)"},
				{name: "Delist/Denial Log Channel", value: dchan ? dchan.mention : "(not set)"},
				{name: "Representative Role", value: rrole ? rrole.mention : "(not set)"}
			]
		}})
	},
	alias: ['conf','cfg'],
	subcommands: {},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.banlog = {
	help: ()=> "Sets banlog channel",
	usage: ()=> [" [channel] - Sets banlog channel for the server (NOTE: can be channel ID, channel mention, or channel name"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage('Please provide a channel.');
		var chan = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g,"") || ch.name == args[0].toLowerCase());
		if(!chan) return msg.channel.createMessage("Channel not found");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {banlog_channel: chan.id});
		if(scc) msg.channel.createMessage("Banlog channel set!");
		else msg.channel.createMessage("Something went wrong");

	},
	alias: ['banchannel', "banlogs", "banlogchannel"],
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.banmsg = {
	help: ()=> "Set the message that a user is DM'd upon being banned",
	usage: ()=> [" [message] - Set the message"],
	desc: ()=> "This is NOT the message that appears when a member is banned. This will be DM'd to a user that is banned as long as they are in the server when the ban happened.\nAvailable message vars:\n$REASON - The reason the user was banned",
	execute: async (bot, msg, args) => {
		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {ban_message: args.join(" ")});
		if(scc) msg.channel.createMessage("Ban message set!");
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["banmessage","bm","banlogmessage","banlogmsg"],
	permissions: ["manageGuild"],
	guildOnly: true
}

module.exports.subcommands.reprole = {
	help: ()=> "Sets server rep role",
	usage: ()=> [" [role] - Sets rep role for the server (NOTE: can be role ID, role mention, or role name"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage('Please provide a channel.');
		var role = msg.guild.roles.find(rl => rl.id == args[0].replace(/[<&>]/g,"") || rl.name.toLowerCase() == args.join(" ").toLowerCase());
		if(!role) return msg.channel.createMessage("Role not found");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {reprole: role.id});
		if(scc) msg.channel.createMessage("Representative role set!");
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.delist = {
	help: ()=> "Sets delist channel",
	usage: ()=> [" [channel] - Sets delist channel for the server (NOTE: can be channel ID, channel mention, or channel name"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage('Please provide a channel.');
		var chan = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g,"") || ch.name == args[0].toLowerCase());
		if(!chan) return msg.channel.createMessage("Channel not found");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {delist_channel: chan.id});
		if(scc) msg.channel.createMessage("Delist channel set!");
		else msg.channel.createMessage("Something went wrong");

	},
	alias: ['delistchannel', "delete", "delisting", "deletechannel", "denychannel", "deny"],
	permissions: ["manageMessages"],
	guildOnly: true
}