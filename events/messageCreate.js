module.exports = async (msg, bot) => {
	if(msg.author.bot) return;

	var prefix = new RegExp("^"+bot.prefix, "i");
	if(!msg.content.toLowerCase().match(prefix)) return;
	let args = msg.content.replace(prefix, "").split(" ");
	let cmd = await bot.parseCommand(bot, msg, args);
	if(!cmd) cmd = await bot.parseCustomCommand(bot, msg, args);
	console.log(cmd);
	if(cmd) {

		var cfg = msg.guild ? await bot.utils.getConfig(bot, msg.guild.id) : {};
		if(cfg && cfg.blacklist && cfg.blacklist.includes(msg.author.id)) return msg.channel.createMessage("You have been banned from using this bot.");
		if(!cmd[0].permissions || (cmd[0].permissions && cmd[0].permissions.filter(p => msg.member.permission.has(p)).length == cmd[0].permissions.length)) {
			cmd[0].execute(bot, msg, cmd[1], cmd[0]);
		} else {
			msg.channel.createMessage("You do do not have permission to do this.")
		}
		
	}
	else msg.channel.createMessage("Command not found.");
}