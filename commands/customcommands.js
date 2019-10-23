module.exports = {
	help: ()=> "Create custom commands",
	usage: ()=> [" - List current custom commands",
				 " create - Run a menu to create a new command",
				 " info [commandname] - Get info on a command",
				 " edit [commandname] - Edit a command",
				 " delete [commandname] - Delete a custom command"],
	execute: async (bot, msg, args) => {
		var cmds = await bot.utils.getCustomCommands(bot, msg.guild.id);
		if(!cmds) return msg.channel.createMessage("No custom commands registered for this server");
		console.log(cmds);
		msg.channel.createMessage({
			embed: {
				title: "Custom commands",
				description: cmds.map(c => c.name).join("\n")
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
		var name;
		var actions = [];
		var del;
		var response;
		var target;
		var done = false;
		await msg.channel.createMessage("Enter a name for the command.");
		try {
		response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Action cancelled: timed out");
		}
		var cmd = await bot.utils.getCustomCommand(bot, msg.guild.id, response);
		if(cmd || bot.commands[response]) return msg.channel.createMessage("ERR: Command with that name exists. Aborting");
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
		else return msg.channel.createMessage("ERR: Invalid target. Aborting");

		try {
			for(var i = 0; i < 5; i++) {
				if(done) break;
				await msg.channel.createMessage(`Action number: ${actions.length+1}/5\nAvailable actions:
					\`\`\`
					rr - remove a role
					ar - add a role
					\`\`\`
				Type "finished" to end action adding`);

				response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
				switch(response) {
					case "rr":
						await msg.channel.createMessage("Type the name of the role you want to remove.")
						response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
						if(!msg.guild.roles.find(r => r.name.toLowerCase() == response)) return msg.channel.createMessage("ERR: Role not found. Aborting");
						actions.push({type: "rr", action: `${target}.rr(rf('${response}'))`})
						break;
					case "ar":
						await msg.channel.createMessage("Type the name of the role you want to add.")
						response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
						if(!msg.guild.roles.find(r => r.name.toLowerCase() == response)) return msg.channel.createMessage("ERR: Role not found. Aborting");
						actions.push({type: "rr", action:`${target}.ar(rf('${response}'))`})
						break;
					case "finished":
						done = true;
						break;
					default:
						return msg.channel.createMessage("ERR: Invalid action. Aborting");
						break;
				}
			}
		} catch(e) {
			return msg.channel.createMessage("Action cancelled: timed out");
		}

		if(actions.length == 0) return msg.channel.createMessage("ERR: No actions added. Aborting");

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
		if(response != "y") return msg.channel.createMessage("Action aborted");

		var scc = await bot.utils.addCustomCommand(bot, msg.guild.id, name, actions, target, del);
		if(scc) msg.channel.createMessage("Custom command added!");
		else msg.channel.createMessage("Something went wrong");
		// msg.channel.createMessage("This command is currently under construction. However, manual database editing can be used to create custom commands. USE WITH EXTREME CAUTION.")
	},
	permissions: ["manageGuild"]
}