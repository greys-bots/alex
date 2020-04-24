module.exports = {
	help: ()=> "Displays help embed(s)",
	usage: ()=> [" - Displays help for all commands",
				" [command] - Displays help for specfic command",
				" [command] [subcommand]... - Displays help for a command's subcommands"],
	execute: async (bot, msg, args) => {
		if(!args[0]) {
			//setup
			var modules = bot.modules.map(m => m);
			modules.forEach(m => m.commands = m.commands.map(c => c));

			var embeds = [{embed: {
				title: "Alex",
				description: [
					"*A heavy-lifter bot for hub-style Discord servers*\n",
					"Hiya, I'm Alex! My job is to help people list and manage servers, ",
					"either in terms of server partnerships or for those interested in ",
					"creating servers that act as directories of other servers"
				].join(""),
				fields: [
					{
						name: "Features",
						value: [
							"- Server listing, delisting, and post editing",
							"- Reaction roles, for creating gated areas",
							"- Starboards (yes, several per server!)",
							"- Custom commands",
							"- And lots more!"							
						].join("\n")
					},
					{
						name: "Modules",
						value: [
							"My commands are split into *modules*, or groups\n",
							"Tabbing through this embed by hitting the \u2b05 and \u27a1 ",
							"reactions will give you a better idea of what each module ",
							"does. You can also enable/disable specific modules, or get ",
							"more info on a module using `ha!help [module]`"
						].join("")
					}
				],
				footer: {
					icon_url: bot.user.avatarURL,
					text: "Use the arrow reacts to navigate back and forth"
				}
			}}];
			for(var i = 0; i < modules.length; i++) {
				if(modules[i].commands.length == 0) continue;
				var tmp_embeds = await bot.utils.genEmbeds(bot, modules[i].commands, c => {
					return {name:  `**${bot.prefix + c.name}**`, value: c.help()}
				}, {
					title: `**${modules[i].name}**`,
					description: modules[i].description,
					color: parseInt(modules[i].color, 16) || parseInt("555555", 16),
					footer: {
						icon_url: bot.user.avatarURL,
						text: "Use the arrow reacts to navigate back and forth"
					}
				}, 10, {addition: ""})
				
				embeds = embeds.concat(tmp_embeds);
			}

			if(embeds[1]) {
				for(let i=0; i<embeds.length; i++) {
					embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${bot.commands.size} commands total)`;
				}
			}	

			return embeds;
		}

		if(bot.modules.get(args.join(" ").toLowerCase())) {
			let module = bot.modules.get(args.join(" ").toLowerCase());
			module.commands = module.commands.map(c => c);

			var embeds = await bot.utils.genEmbeds(bot, module.commands, c => {
				return {name: `**${bot.prefix + c.name}**`, value: c.help()}
			}, {
				title: `**${module.name}**`,
				description: module.description,
				color: parseInt(module.color, 16) || parseInt("555555", 16),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "Use the arrow reacts to navigate back and forth"
				}
			}, 10, {addition: ""});

			for(let i=0; i<embeds.length; i++) {
				if(embeds.length > 1) embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${module.commands.length} commands total)`;
			}

			return embeds;
		} else if(bot.commands.get(bot.aliases.get(args[0].toLowerCase()))) {
			let {command} = await bot.parseCommand(bot, msg, args);
			var embed = {embed: {
				title: `Help | ${command.name.toLowerCase()}`,
				description: command.help(),
				fields: [
					{name: "**Usage**", value: `${command.usage().map(c => `**${bot.prefix + command.name}**${c}`).join("\n")}`},
					{name: "**Aliases**", value: `${command.alias ? command.alias.join(", ") : "(none)"}`},
					{name: "**Subcommands**", value: `${command.subcommands ?
							command.subcommands.map(sc => `**${bot.prefix}${sc.name}** - ${sc.help()}`).join("\n") : 
							"(none)"}`}
				],
				color: parseInt(command.module.color, 16) || parseInt("555555", 16),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "Arguments like [this] are required, arguments like <this> are optional"
				}
			}};
			if(command.desc) embed.embed.fields.push({name: "**Extra**", value: command.desc()});
			if(command.permissions) embed.embed.fields.push({name: "**Permissions**", value: command.permissions.join(", ")});

			return embed;
		} else return "Command/module not found";
	},
	alias: ["h", "halp", "?"]
}