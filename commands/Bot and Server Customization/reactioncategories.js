module.exports = {
	help: ()=> "Creates categories for reaction roles",
	usage: ()=> [" - Lists available categories and their IDs",
				 " create [name] [description] - Creates new react role category",
				 " delete [ID] - Deletes category (does not delete associated reaction roles)",
				 " add [ID] [role] - Adds react role to the category",
				 " remove [ID] [role] - Removes react role from the category",
				 " name [ID] [new name] - Changes category name",
				 " description [ID] [new desription] - Changes category description",
				 " post [category] [channel] - Posts category's roles in a channel",
				 " info [ID] - Gets info on a category (eg: roles registered to it)"],
	execute: async (bot, msg, args)=> {
		var embeds = [];
		if(args[0]) {
			var category = await bot.stores.reactCategories.get(msg.guild.id, args[0].toLowerCase());
			if(!category) return "Category not found";
			if(!category.roles || !category.roles[0]) return "That category has no roles indexed";

			embeds = await bot.utils.genEmbeds(bot, category.roles, rl => {
				return {name: `${rl.raw.name} (${rl.emoji.includes(":") ? `<${rl.emoji}>` : rl.emoji})`, value: `Description: ${rl.description || "*(no description provided)*"}\nPreview: ${rl.raw.mention}`}
			}, {
				title: `${category.name} (${category.hid})`,
				description: category.description,
			}, 10);
		} else {
			var categories = await bot.stores.reactCategories.getAll(msg.guild.id);
			if(!categories || !categories[0]) return 'No categories have been indexed';

			var err = false;
			for(category of categories) {
				var tmp;
				if(category.roles && category.roles[0]) {
					tmp = await bot.utils.genEmbeds(bot, category.roles, rl => {
						return {name: `${rl.raw.name} (${rl.emoji.includes(":") ? `<${rl.emoji}>` : rl.emoji})`, value: `Description: ${rl.description || "*(no description provided)*"}\nPreview: ${rl.raw.mention}`}
					}, {
						title: category.name,
						description: category.description,
						footer: {text: `ID: ${category.hid}`}
					}, 10, {addition: ""});
				} else {
					tmp = {embed: {
						title: `${category.name} (${category.hid})`,
						description: category.description,
						fields: [
							{name: "No roles", value: "This category has no roles indexed"}
						]
					}}
				}
				embeds = embeds.concat(tmp);
			}

			embeds.forEach((e, i) => e.embed.title = `${e.embed.title} (page ${i+1}/${embeds.length}, ${categories.length} categories total)`);
		}

		return embeds;
	},
	alias: ['reactcategories', 'rc'],
	permissions: ["manageRoles"],
	subcommands: {},
	guildOnly: true
}

module.exports.subcommands.create = {
	help: ()=> "Creates a new reaction role category",
	usage: ()=> [" [name] (new line) [description] - Creates a new category with the given name and description (NOTE: description needs to be on new line)"],
	execute: async (bot, msg, args)=> {
		var nargs = args.join(" ").split("\n");
		var code = bot.utils.genCode(bot.chars);

		try {
			await bot.stores.reactCategories.create(msg.guild.id, code, {name: nargs[0], description: nargs.slice(1).join("\n")});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Category created! ID: "+code;
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes a category",
	usage: ()=> [" [id] - Deletes a reaction category"],
	execute: async (bot, msg, args) => {
		var category = bot.stores.reactCategories.get(msg.guild.id, args[0]);
		if(!category) return 'Category does not exist';

		await bot.stores.reactCategories.delete(msg.guild.id, args[0]);
		return "Category deleted!";
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.name = {
	help: ()=> "Changes name for a category",
	usage: ()=> [" [ID] [name] - Changes name for the given category"],
	execute: async (bot, msg, args)=> {
		var category = bot.stores.reactCategories.get(msg.guild.id, args[0].toLowerCase());
		if(!category) return 'Category does not exist';

		try {
			await bot.stores.reactCategories.update(msg.guild.id, category.hid, {name: args.slice(1).join(" ")});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Category updated!";
	},
	alias: ["describe", "desc"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.description = {
	help: ()=> "Changes description for a category",
	usage: ()=> [" [ID] [description] - Changes description for the given category"],
	execute: async (bot, msg, args)=> {
		var category = bot.stores.reactCategories.get(msg.guild.id, args[0]);
		if(!category) return 'Category does not exist';

		try {
			await bot.stores.reactCategories.update(msg.guild.id, category.hid, {description: args.slice(1).join(" ")});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Category updated!";
	},
	alias: ["describe", "desc"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.add = {
	help: ()=> "Changes description for a category",
	usage: ()=> [" [ID] [comma, separated, role names] - Adds role to a category"],
	execute: async (bot, msg, args)=> {
		var category = await bot.stores.reactCategories.get(msg.guild.id, args[0].toLowerCase());
		if(!category) return 'Category does not exist';

		var result = [];
		var roles = args.slice(1).join(" ").split(/,\s+/g);
		var max = category.posts && category.posts[0] ? category.posts.sort((a,b)=> a.page - b.page)[0].page : 0;
		for(var rl of roles) {
			var role = msg.guild.roles.find(r => r.id == rl.replace(/[<&>]/g, "") || r.name.toLowerCase() == rl.toLowerCase());
			if(!role) {
				result.push({succ: false, name: rl, reason: "Role not found"})
			}
			var rr = await bot.stores.reactRoles.get(msg.guild.id, role.id);
			if(!rr) {
				result.push({succ: false, name: rl, reason: "React role not found"});
			} else {
				if(category.roles.find(r => r.id == rr.id)) {
					result.push({succ: false, name: role.name, reason: "React role already in category"});
				} else if(category.roles.find(r => r.emoji == rr.emoji)) {
					result.push({succ: false, name: role.name, reason: "React role with that emoji already in category"});
				} else {
					result.push({succ: true, name: role.name});
					category.raw_roles.push(rr.id);
				}
			}
		}

		try {
			await bot.stores.reactCategories.update(msg.guild.id, category.hid, {roles: category.raw_roles});
		} catch(e) {
			return "ERR: "+e;
		}

		return {
			content: Math.ceil(category.roles.length/10)-1 > max ?
				"The category has been updated- however, because the amount of roles is greater than "+
				"the amount that the current number of pages can handle, the posts have not been updated.\n"+
				"If you would like for all the roles to be visible, **delete the current posts** and use "+
				"`hub!rc post "+category.hid+" (channel)` to post them again." :
				"",
			embed: {
				title: "Results",
				fields: [
					{name: "Added", value: result.filter(r => r.succ).map(r => r.name).join("\n") || "none"},
					{name: "Not Added", value: result.filter(r => !r.succ).map(r => `${r.name} - ${r.reason}`).join("\n") || "none"},	
				]
			}
		};
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Changes description for a category",
	usage: ()=> [" [ID] [role] - Adds role to a category"],
	execute: async (bot, msg, args)=> {
		var category = await bot.stores.reactCategories.get(msg.guild.id, args[0].toLowerCase());
		if(!category) return 'Category does not exist';

		var result = [];
		var roles = args.slice(1).join(" ").split(/,\s+/g);
		var max = category.posts ? category.posts.sort((a,b)=> a.page - b.page) : 0;
		for(var rl of roles) {
			var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == rl || r.name.toLowerCase() == rl.toLowerCase());
			if(!role) {
				result.push({succ: false, name: rl, reason: "Role not found"})
			}

			var rr = await bot.stores.reactRoles.get(msg.guild.id, role.id);
			if(!rr) {
				result.push({succ: false, name: role.name, reason: "React role not found"});
			} else {
				category.raw_roles = category.raw_roles.filter(x => x != rr.id);
				result.push({succ: true, name: role.name});
			}
		}

		try {
			await bot.stores.reactCategories.update(msg.guild.id, category.hid, {roles: category.raw_roles});
		} catch(e) {
			return "ERR: "+e;
		}

		return {
			content: Math.ceil(category.roles.length/10)-1 > max ?
				"The category has been updated- however, because the amount of roles is greater than "+
				"the amount that the current number of pages can handle, the posts have not been updated.\n"+
				"If you would like for all the roles to be visible, **delete the current posts** and use "+
				"`hub!rc post "+category.hid+" (channel)` to post them again." :
				"",
			embed: {
				title: "Results",
				fields: [
					{name: "Removed", value: result.filter(r => r.succ).map(r => r.name).join("\n") || "none"},
					{name: "Not Removed", value: result.filter(r => !r.succ).map(r => `${r.name} - ${r.reason}`).join("\n") || "none"},	
				]
			}
		};
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.post = {
	help: ()=> "Posts a message with all possible reaction roles",
	usage: ()=> [" [category] [channel] - Posts reaction roles message in given channel"],
	execute: async (bot, msg, args) => {
		var category = await bot.stores.reactCategories.get(msg.guild.id, args[0].toLowerCase());
		if(!category) return 'Category does not exist';

		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[1] || ch.name == args[1]);
		if(!channel) return 'Channel not found';

		var posts = await bot.utils.genReactPosts(bot, category.roles, {
			title: category.name,
			description: category.description,
			footer: {
				text: "Category ID: "+category.hid
			}
		});

		for(var i = 0; i < posts.length; i++) {
			var message = await channel.createMessage({embed: posts[i].embed});
			posts[i].emoji.forEach(r => message.addReaction(r));
			var post = await bot.stores.reactPosts.create(msg.guild.id, channel.id, message.id, posts[i]);
			category.raw_posts.push(post.id);
		}

		await bot.stores.reactCategories.update(msg.guild.id, category.hid, {posts: category.raw_posts}, false);
	},
	permissions: ["manageRoles"],
	guildOnly: true
}