module.exports = {
	help: ()=> "Create custom commands",
	usage: ()=> [" - List current custom commands",
				 " create - Run a menu to create a new command",
				 " info [commandname] - Get info on a command",
				 " edit [commandname] - Edit a command",
				 " delete [commandname] - Delete a custom command"],
	execute: async (bot, msg, args) => {
		var cmds = await bot.stores.customCommands.getAll(msg.guild.id);
		if(!cmds) return "No custom commands registered for this server";

		return {
			embed: {
				title: "Custom commands",
				description: cmds.map(c => c.name).join("\n")
			}
		}
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
		var name;
		var actions = [];
		var del;
		var response;
		var target;
		var done = false;
		await msg.channel.createMessage("Enter a name for the command.");
		try {
			response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.replace(/\s/g,"").toLowerCase();
		} catch(e) {
			console.log(e);
			return "Action cancelled: timed out";
		}
		var cmd = await bot.stores.customCommands.get(msg.guild.id, response);
		if(cmd || bot.commands.get(bot.aliases.get(response))) return "ERR: Command with that name exists. Aborting";
		name = response;

		await msg.channel.createMessage(`Who is the target of the command?
		\`\`\`
		user - the person that used the command
		args - people specified through arguments (using member IDs)
		\`\`\`
		`)
		response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();

		if(response == "user") target = "member";
		else if(response == "args") target = "args";
		else return "ERR: Invalid target. Aborting";

		try {
			for(var i = 0; i < 5; i++) {
				if(done) break;
				await msg.channel.createMessage(`
				Action number: ${actions.length+1}/5\nAvailable actions:
				\`\`\`
				rr - remove a role
				ar - add a role
				bl - blacklist user from using the bot
				\`\`\`
				Type \`finished\` to end action adding`);

				response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
				switch(response) {
					case "rr":
						await msg.channel.createMessage("Type the name of the role you want to remove.")
						response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
						if(!msg.guild.roles.find(r => r.id == response.replace(/[<@&>]/g, "") || r.name.toLowerCase() == response)) return "ERR: Role not found. Aborting";
						actions.push({type: "rr", action: `${target}.rr(rf('${response}'))`})
						break;
					case "ar":
						await msg.channel.createMessage("Type the name of the role you want to add.")
						response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
						if(!msg.guild.roles.find(r => r.id == response.replace(/[<@&>]/g, "") || r.name.toLowerCase() == response)) return "ERR: Role not found. Aborting";
						actions.push({type: "rr", action:`${target}.ar(rf('${response}'))`})
						break;
					case "bl":
						actions.push({type: "bl", action: `${target}.bl`})
						break;
					case "finished":
						done = true;
						break;
					default:
						return "ERR: Invalid action. Aborting";
						break;
				}

				if(!done) {
					await msg.channel.createMessage("Enter a success message for this action. NOTE: if using args as the target, this message will fire for every arg. Type `skip` to skip");
					response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content;
					if(response.toLowerCase() != "skip") actions[i].success = response;

					await msg.channel.createMessage("Enter a fail message for this action. NOTE: if using args as the target, this message will fire for every arg. Type `skip` to skip");
					response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content;
					if(response.toLowerCase() != "skip") actions[i].fail = response;
				}
			}
		} catch(e) {
			return "Action cancelled: timed out";
		}

		if(actions.length == 0) return "ERR: No actions added. Aborting";

		await msg.channel.createMessage("Would you like the user's message to be deleted? (y/n)");
		response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
		if(response == "y") del = true;
		else del = false;

		await msg.channel.createMessage({content: "Is this correct? (y/n)", embed: {
			title: name,
			description: (del ? "Message will be deleted after command execution" : "Message will not be deleted after command execution")+"\n"+
						 (target == "member" ? "Command will affect who is using it" : "Command will affect members given as arguments"),
			fields: actions.map((a, i) => {
				return {name: "Action "+(i+1), value: a.action}
			})
		}})

		response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
		if(response != "y") return "Action aborted";

		try {
			await bot.stores.customCommands.create(msg.guild.id, name, {actions, target, del});
		} catch(e) {
			return e;
		}

		return "Custom command added!";
	},
	alias: ['create', 'new'],
	permissions: ["manageGuild"],
	guildOnly: true
}

module.exports.subcommands.delete = {
	help: ()=> "Delete a custom command",
	usage: ()=> [" [cmdName] - Deletes the given command"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a command to delete";

		var cmd = await bot.stores.customCommands.get(msg.guild.id, args[0]);
		if(!cmd) return "Command does not exist";

		try {
			await bot.stores.customCommands.delete(msg.guild.id, args[0]);
		} catch(e) {
			return e;
		}

		return "Command deleted!";
	},
	alias: ['remove'],
	guildOnly: true,
	permissions: ["manageGuild"]
}