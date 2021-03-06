module.exports = async (msg, emoji, user, bot)=>{
	if(bot.user.id == user.id) return;

	if(bot.menus && bot.menus[msg.id] && bot.menus[msg.id].user == user.id) {
		try {
			await bot.menus[msg.id].execute(bot, msg, emoji);
		} catch(e) {
			console.log(e);
			writeLog(e);
			msg.channel.createMessage("Something went wrong: "+e.message);
		}
	}
}