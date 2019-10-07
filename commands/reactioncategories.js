module.exports = {
	help: "Creates categories for reaction roles",
	usage: [" - Lists available categories and their IDs",
				 " create [name] (new line) [description] - Creates new react role category",
				 " delete [ID] - Deletes category (does not delete associated reaction roles)",
				 " add [ID] [role] - Adds react role to the category",
				 " remove [ID] [role] - Removes react role from the category",
				 " name [ID] [new name] - Changes category name",
				 " description [ID] [new desription] - Changes category description",
				 " post [channel] <ID> - Posts category's roles in a channel. If no category is given, posts all",
				 " info [ID] - Gets info on a category (eg: roles registered to it)"],
	examples: ["ha!rc","ha!rc create Cool Roles","ha!rc add clrls cool peeps","ha!rc delete clrls"],
	alias: ['reactcategories', 'rc'],
	permissions: ["manageRoles"],
	subcommands: {}
}

module.exports.subcommands.create = {
	help: "Creates a new reaction role category",
	usage: [" [name] (new line) [description] - Creates a new category with the given name and description (NOTE: description needs to be on new line)"],
	examples: ["ha!rc create cool roles", "ha!rc create cool roles<br/>Some Cool Roles:tm:"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.delete = {
	help: "Deletes a category",
	usage: [" [id] - Deletes a reaction category"],
	examples: ["ha!rc delete clrls"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.name = {
	help: "Changes name for a category",
	usage: [" [ID] [name] - Changes name for the given category"],
	examples: ["ha!rc name clrls cooler roles"],
	alias: ["rename"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.description = {
	help: "Changes description for a category",
	usage: [" [ID] [description] - Changes description for the given category"],
	examples: ["ha!rc desc clrls cool roles times TWO"],
	alias: ["describe", "desc"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.add = {
	help: "Adds an already indexed reaction role to a category",
	usage: [" [ID] [comma, separated, role names] - Adds the reaction role to a category"],
	examples: ["ha!rc add clrls Cool Role"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.remove = {
	help: "Removes a role from a category",
	usage: [" [ID] [role] - Removes reaction role from a category"],
	examples: ["ha!rc remove clrls Cool Role"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.post = {
	help: "Posts a message with all possible reaction roles",
	usage: [" [category] [channel] - Posts reaction roles message in given channel"],
	examples: ["ha!rc post clrls cool-channel"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.info = {
	help: "Get info on a reaction category",
	usage: [" [id] - Get info on a reaction category"],
	examples: ["ha!rc info clrls"],
	permissions: ["manageRoles"]
}