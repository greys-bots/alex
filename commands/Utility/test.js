module.exports = {
	help: ()=> "Test command",
	usage: ()=> [" - Test that the bot is up"],
	execute: (bot, msg, args) =>{
		msg.channel.createMessage("Beep boop")
	},
	alias: ["t"]
}