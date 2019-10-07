module.exports = {
	help: "Sets, adds, or removes contact(s) for a server.",
	usage: [" [server_id] [user_id/mention] - Sets server contact(s).",
				 " add [server_id] [user_id/mention] - Adds server contact(s).",
				 " remove [server_id] [user_id/mention] - Removes server contact. *(only one at a time, for ease)*"
				],
	examples: ["ha!contact 1234567890 510385919 69294010", "ha!contact add 1234567890 78345010", "ha!contact remove 1234567890 510385919"],
	subcommands: {},
	alias: ["con","c"],
	permissions: ["manageMessages"]
}

module.exports.subcommands.add = {
	help: "Adds contact(s) to a server. User IDs should be space delimited.",
	usage: [" [servID] [usrID] [usrID]... - Adds contact(s) to the server."],
	examples: ["ha!contact add 1234567890 8918401106 5819406010"],
	permissions: ["manageMessages"]
}

module.exports.subcommands.remove = {
	help: "Removes a contact from a server.",
	usage: [" [servID] [usrID] - Removes one (1) contact from the server."],
	examples: ["ha!contact remove 1234567890 5819406010"],
	permissions: ["manageMessages"]
}