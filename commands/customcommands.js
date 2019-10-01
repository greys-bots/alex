module.exports = {
	help: ()=> "Create custom commands",
	usage: ()=> [" - List current custom commands",
				 " create - Run a menu to create a new command",
				 " info [commandname] - Get info on a command",
				 " edit [commandname] - Edit a command",
				 " delete [commandname] - Delete a custom command"],
	desc: ()=> "This command is currently under construction.",
	execute: async (bot, msg, args) => {
		var cmds = bot.utils.getCustomCommands(bot, msg.guild.id);
		if(!cmds) return msg.channel.createMessage("No custom commands registered for this server");

		msg.channel.createMessage({
			embed: {
				title: "Custom commands",
				description: cmds.map(c => c.name).join(" ")
			}
		})
	},
	subcommands: {},
	alias: ["cc", "custom"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.add = {
	help: ()=> "WORK IN PROGRESS",
	usage: ()=> ["WORK IN PROGRESS"],
	execute: async (bot, msg, args) => {
		msg.channel.createMessage("This command is currently under construction. However, manual database editing can be used to create custom commands. USE WITH EXTREME CAUTION.")
	},
	permissions: ["manageGuild"]
}