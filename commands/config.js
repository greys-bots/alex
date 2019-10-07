module.exports = {
	help: "Sets configs for the server.",
	usage: [" banlog [channel] - Sets banlog channel for the server",
			" reprole [role] - Sets representative role for the server",
			" delist [channel] - Sets channel for delisting/denial logs"],
	examples: ["ha!conf banlog user-bans", "ha!conf reprole @reps", "ha!conf delist listing-logs"],
	alias: ['conf'],
	subcommands: {},
	permissions: ["manageMessages"]
}

module.exports.subcommands.banlog = {
	help: "Sets banlog channel",
	usage: [" [channel] - Sets banlog channel for the server (NOTE: can be channel ID, channel mention, or channel name"],
	examples: ["ha!conf banlog user-bans"],
	alias: ['banchannel', "banlogs", "banlogchannel"],
	permissions: ["manageMessages"]
}

module.exports.subcommands.reprole = {
	help: "Sets server rep role",
	usage: [" [role] - Sets rep role for the server (NOTE: can be role ID, role mention, or role name"],
	examples: ["ha!conf reprole @reps"],
	permissions: ["manageMessages"]
}

module.exports.subcommands.delist = {
	help: "Sets delist channel",
	usage: [" [channel] - Sets delist channel for the server (NOTE: can be channel ID, channel mention, or channel name"],
	examples: ["ha!conf delist listing-logs"],
	alias: ['delistchannel', "delete", "delisting", "deletechannel", "denychannel", "deny"],
	permissions: ["manageMessages"]
}