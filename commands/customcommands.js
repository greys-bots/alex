module.exports = {
	help: "Create custom commands. CURRENTLY UNDER CONSTRUCTION",
	usage: [" - List current custom commands",
				 " create - Run a menu to create a new command",
				 " info [commandname] - Get info on a command",
				 " edit [commandname] - Edit a command",
				 " delete [commandname] - Delete a custom command"],
	examples: ["<em>This command is currently under construction and thus nonfunctional</em>"],
	// subcommands: {},
	alias: ["cc", "custom"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

// module.exports.subcommands.add = {
// 	help: ()=> "WORK IN PROGRESS",
// 	usage: ()=> ["WORK IN PROGRESS"],
// 	execute: async (bot, msg, args) => {
// 		msg.channel.createMessage("This command is currently under construction. However, manual database editing can be used to create custom commands. USE WITH EXTREME CAUTION.")
// 	},
// 	permissions: ["manageGuild"]
// }