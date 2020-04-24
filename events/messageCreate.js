module.exports = async (msg, bot) => {
	if(msg.author.bot) return;

	var prefix = new RegExp("^"+bot.prefix, "i");
	if(!msg.content.toLowerCase().match(prefix)) return;
	var {command, args, permcheck} = await bot.parseCommand(bot, msg, msg.content.replace(prefix, "").split(" "));
	if(!command) ({command, args} = await bot.parseCustomCommand(bot, msg, msg.content.replace(prefix, "").split(" ")));
	if(!command) return msg.channel.createMessage("Command not found");
	
	console.log(command.name);
	if(command.guildOnly && !msg.guild) return msg.channel.createMessage("This command can only be used in guilds");
	var cfg = msg.guild ? await bot.stores.configs.get(msg.guild.id) : {};
	if(cfg && cfg.blacklist && cfg.blacklist.includes(msg.author.id)) return msg.channel.createMessage("You have been banned from using commands :(");
	if(command.permissions && !permcheck) return msg.channel.createMessage("You don't have permission to do this!");
	
	var result;
	try {
		result = await command.execute(bot, msg, args, command);
	} catch(e) {
		console.log(e);
		return msg.channel.createMessage("ERR: "+(e.message || e));
	}

	if(!result) return;
	if(typeof result == "object" && result[0]) { //embeds
		var message = await msg.channel.createMessage(result[0]);
		if(result[1]) {
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				data: result,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					try {
						message.removeReactions();
					} catch(e) {
						console.log(e);
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["⬅️", "➡️", "⏹️"].forEach(r => message.addReaction(r));
		}
	} else msg.channel.createMessage(result);
}