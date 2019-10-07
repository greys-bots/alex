module.exports = {
	help: "Registers channel and reaction emoji for a server pinboard.<br/>" +
		  ["The moderator override determines if moderators can add things to the pinboard ",
			"without needing to hit the reaction tolerance, ",
			"'moderators' being those with the manageMessages permission.",
			"<br/>Tolerance refers to how many reactions are needed to add a message to the board. ",
			"By default, this number is 2. The global tolerance will be used for boards without ",
			"their own specified tolerance."].join(""),
	usage: [" add [chanName | chanID | #channel] [:emoji:] - Add channel and reaction config",
				" remove [chanName | chanID | #channel] - Remove channel config",
				" view - View current configs",
				" config - Show current tolerance and override configurations",
				" tolerance [number] - Set global pin tolerance",
				" tolerance - Reset global pin tolerance",
				" tolerance [channel] [number] - Set tolerance for a specific board",
				" tolerance [channel] - Reset tolerance for a specific board",
				" override [(true|1)|(false|0)] - Sets moderator override"],
	examples: ["ha!starboard add cool-stuff :pushpin:"],
	subcommands: {},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["pinboard", "pb", "sb"]
}

module.exports.subcommands.add = {
	help: "Adds a channel to the server's starboard config. The emoji can be a custom one as long as it's in the same server",
	usage: [" [chanName | chanID | #channel] [:emoji:] - Adds channel and reaction config for the server."],
	examples: ["ha!sb add cool-stuff :pushpin:", "ha!sb add other-cool-stuff :star:"],
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["a","new"]
}

module.exports.subcommands.remove = {
	help: "Removes a channel from the server's starboard config",
	usage: [" [chanName | chanID | #channel]- Removes the channel's pin config."],
	examples: ["ha!remove cool-stuff"],
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["r","delete"]
}

module.exports.subcommands.pin = {
	help: "Takes the pins in the current channel and pins them in the pinboard",
	usage: [" [emoji] - Processes pins in the current channel."],
	examples: ["ha!sb pin :star:"],
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["pins","process"]
}

module.exports.subcommands.view = {
	help: "Views the server's starboard config",
	usage: [" - Views the server's starboard config."],
	examples: ["ha!sb view"],
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["list","v","l"]
}

module.exports.subcommands.config = {
	help: "Configure pinboard options",
	usage: [" - Show current configurations"],
	examples: ["ha!cfg"],
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["cfg"]
}

module.exports.subcommands.tolerance = {
	help: "Set the tolerance for boards (or globally)",
	usage: [" [number] - Set global tolerance",
				 " - Reset global tolerance",
				 " [channel] [number] - Set specific tolerance",
				 " [channel] - Reset specific tolerance"],
	examples: ["ha!sb tolerance 3", "ha!sb tolerance cool-stuff 2"],
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["tol"]
}

module.exports.subcommands.override = {
	help: "Sets moderator override for adding items to the pinboard",
	usage: [" [(true|1)|(false|0] - Sets the override. Use 1, true, or enable to enable, false, 0, or disable to disable"],
	examples: ["ha!sb override 1", "ha!sb override true"],
	permissions: ["manageGuild"],
	guildOnly: true
}