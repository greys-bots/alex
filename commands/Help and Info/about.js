module.exports = {
	help: ()=> "View info about the bot",
	usage: ()=> [" - Sends the bot's about message"],
	execute: async (bot, msg, args) => {
		return {embed: {
			title: "about me",
			description:
				"*prrr* i'm ocelot~ i handle roles."+
				"\nmy prefix is `oc!`, which is from my name."+
				"\nhere's some other stuff for you:",
			fields: [
				{name: "Creators", value: "[greysdawn](https://github.com/greysdawn) | GreySkies#9950"},
				{name: "Invite", value: "[Click](https://discordapp.com/api/oauth2/authorize?client_id=547849702465339403&permissions=268561526&scope=bot)", inline: true},
				{name: "Support Server", value: "[Click](https://discord.gg/EvDmXGt)", inline: true},
				{name: "Guilds", value: bot.guilds.cache.size, inline: true},
				{name: "Users", value: bot.users.cache.size, inline: true},
				{name: "Want to support the creators?", value: "[Patreon](https://patreon.com/greysdawn) | [Ko-Fi](https://ko-fi.com/greysdawn)"}
			]

		}};
	},
	alias: ["abt"]
}