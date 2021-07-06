const WELCOMES = [
	"welcome~",
	"prrrrr :orange_heart:",
	"of course~",
	":orange_heart: ~"
];

module.exports = async (msg, bot)=>{
	if(msg.author.bot) return;
	var config = await bot.stores.configs.get(msg.guild?.id);
	var prefix = config?.prefix ? config.prefix : bot.prefix;
	if(!msg.content.toLowerCase().startsWith(prefix)) {
		var thanks = msg.content.match(/^(thanks? ?(you)?|ty),? ?oc(elot)?/i);
		if(thanks) return await msg.channel.send(WELCOMES[Math.floor(Math.random() * WELCOMES.length)]);
		return;
	}
	var log = [
		`Guild: ${msg.guild?.name || "DMs"} (${msg.guild?.id || msg.channel.id})`,
		`User: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
		`Message: ${msg.content}`,
		`--------------------`
	];
	let args = msg.content.replace(prefix, "").split(/ +/);
	if(!args[0]) args.shift();
	if(!args[0]) return msg.channel.send("That's me!");

	let command, permcheck;
	({command, args, permcheck} = await bot.parseCommand(bot, msg, msg.content.replace(prefix, "").split(" ")));
	if(!command) ({command, args} = await bot.parseCustomCommand(bot, msg, msg.content.replace(prefix, "").split(" ")));
	if(!command) {
		log.push('- Command not found -');
		console.log(log.join('\r\n'));
		bot.writeLog(log.join('\r\n'));
		return await msg.channel.send("Command not found");
	}
	if(!permcheck) {
		log.push('- Missing permissions -');
		console.log(log.join('\r\n'));
		bot.writeLog(log.join('\r\n'));
		return await msg.channel.send("You don't have permission to use that command!");
	}
	if(!msg.guild && command.guildOnly) {
		log.push('- Command not found -');
		console.log(log.join('\r\n'));
		bot.writeLog(log.join('\r\n'));
		return await msg.channel.send("That command is guild only");
	}
	
	if(command.group) nargs = bot.utils.groupArgs(args);
	
	try {
		var result = await command.execute(bot, msg, args, config);
	} catch(e) {
		console.log(e);
		log.push(`Error: ${e}`);
		log.push(`--------------------`);
		msg.channel.send('mrr! error:\n'+e.message);
	}
	console.log(log.join('\r\n'));
	bot.writeLog(log.join('\r\n'));
	
	if(!result) return;
	if(typeof result == "object" && result[0]) { //embeds
		var message = await msg.channel.send(result[0]);
		if(result[1]) {
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				data: result,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					try {
						message.reactions.removeAll();
					} catch(e) {
						console.log(e);
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["⬅️", "➡️", "⏹️"].forEach(r => message.react(r));
		}
	} else await msg.channel.send(result);
}