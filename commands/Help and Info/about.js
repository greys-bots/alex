module.exports = {
	help: ()=> "A bit about the bot",
	usage: ()=> [" - What it says on the tin"],
	execute: async (bot, msg, args) => {
		return {embed: {
			title: "About the bot",
			description: "Hi! I'm Alex! :D\nI'm a heavy lifter bot for hub servers-"+
						 " meaning I do all the hard work so you don't have to!"+
						 "\nMy prefix is `ha!`, which stands for `hey alex`"+
						 "\nHere's some more about me:",
			fields: [
				{name: "Creators", value: "[greysdawn](https://github.com/greysdawn) | GreySkies#9950"},
				{name: "Invite", value: "[Clicky!](https://discordapp.com/api/oauth2/authorize?client_id=547849702465339403&permissions=268561526&scope=bot)", inline: true},
				{name: "Support Server", value: "[Clicky!](https://discord.gg/EvDmXGt)", inline: true},
				{name: "Stats", value: `Guilds: ${bot.guilds.size} | Users: ${bot.users.size}`},
				{name: "Want to support the creators?", value: "[Patreon](https://patreon.com/greysdawn) | [Ko-Fi](https://ko-fi.com/greysdawn)"}
			]

		}};
	},
	alias: ["a", "abt"]
}