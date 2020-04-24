module.exports = {
	help: ()=> "Test command",
	usage: ()=> [" - Test that the bot is up"],
	execute: async (bot, msg, args) =>{
		return "Beep boop!";
	},
	alias: ["t"]
}