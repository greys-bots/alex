module.exports = {
	help: ()=> "Displays help embed.",
	usage: ()=> [" - Displays help for all commands.",
				" [command] - Displays help for specfic command."],
	execute: async (bot, msg, args) => {
		let cmd;
		let names;
		let embed;
		if(args[0]) {
			let dat = await bot.parseCommand(bot, msg, args);
			if(dat) {
				cmd = dat[0];
				names = dat[2].split(" ");
				embed = {
					title: `Help | ${names.join(" - ").toLowerCase()}`,
					description: cmd.help(),
					fields: [
						{name: "**Usage**", value: `${cmd.usage().map(c => `**${bot.prefix + names.join(" ")}**${c}`).join("\n")}`},
						{name: "**Aliases**", value: `${cmd.alias ? cmd.alias.join(", ") : "(none)"}`},
						{name: "**Subcommands**", value: `${cmd.subcommands ?
								Object.keys(cmd.subcommands).map(sc => `**${bot.prefix}${dat[2]} ${sc}** - ${cmd.subcommands[sc].help()}`).join("\n") : 
								"(none)"}`}
					],
					footer: {
						icon_url: bot.user.avatarURL,
						text: "Arguments like [this] are required, arguments like <this> are optional."
					}
				}
				if(cmd.desc) embed.fields.push({name: "**Extra**", value: cmd.desc()});
			} else {
				msg.channel.createMessage("Command not found.")
			}
		} else {
			embed = {
				title: `Alex - help`,
				description:
					`**Commands**\n${Object.keys(bot.commands)
									.map(c => `**${bot.prefix + c}** - ${bot.commands[c].help()}`)
									.join("\n")}\n\n`,
				footer: {
					icon_url: bot.user.avatarURL,
					text: "Arguments like [this] are required, arguments like <this> are optional."
				}
			}
		}

		msg.channel.createMessage({embed: embed});
	},
	alias: ["h"]
}