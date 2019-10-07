module.exports = {
	help: "Blacklist a user from interacting with the bot",
	usage: [" - List the currently blacklisted users",
				 " add [id] [id] ... - Add users to the blacklist",
				 " remove [id] [id] ... - Remove users from the blacklist"],
	examples: ["ha!blacklist", "ha!blacklist add 123456 7890987", "ha!blacklist remove 123456"],
	permissions: ["manageMessages"],
	subcommands: {}
}

module.exports.subcommands.add = {
	help: "Add (a) user(s) to the blacklist. IDs can be separated by spaces or new lines",
	usage: [" [id] [id] ... - Add the given users to the blacklist"],
	examples: ["ha!blacklist add 1234567890", "ha!blacklist add 68110681068 28110451045"],
	permissions: ["manageMessages"]
}

module.exports.subcommands.remove = {
	help: "Remove (a) user(s) from the blacklist. IDs can be separated by spaces or new lines",
	usage: [" [id] [id] ... - Remove the given users from the blacklist"],
	examples: ["ha!blacklist remove 28110451045 1234567890"],
	permissions: ["manageMessages"]
}