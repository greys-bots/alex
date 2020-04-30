module.exports = {
	help: ()=> "Sets, adds, or removes contact(s) for a server",
	usage: ()=> [" [server_id] [user_id/mention] - Sets server contact(s)",
				 " add [server_id] [user_id/mention] - Adds server contact(s)",
				 " remove [server_id] [user_id/mention] - Removes server contact. *(only one at a time, for ease)*"
				],
	execute: async (bot, msg, args)=>{
		let guild = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!guild) return "That server does not exist";

		if(!args[1]) {
			if(!guild.contact_id || !guild.contact_id[0]) return "That guild has no contacts registered!";
			var contacts = await bot.utils.verifyUsers(bot, guild.contact_id);
			return {embed: {
				fields: [
					{name: "Current Contacts", value: contacts.info.map(u => u.mention).join("\n")}
				],
				footer: {text: `Server ID: ${guild.server_id}`}
			}}
		}

		var old = guild.contact_id;
		var dat = await bot.utils.verifyUsers(bot, args.slice(1).map(a => a.replace(/[<@!>]/g,"")));
		try {
			guild = await bot.stores.servers.update(msg.guild.id, args[0], {contact_id: dat.pass});
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, args[0], guild);
		} catch(e) {
			return "ERR: "+e;
		}
		
		var conf = await bot.stores.configs.get(msg.guild.id);
		if(conf && conf.reprole) {
			for(var m of dat.pass) {
				try {
					await msg.guild.addMemberRole(m, conf.reprole)
				} catch(e) {
					console.log(e);
				}
			}

			if(old) {
				for(var m of old) {
					var mg = await bot.stores.servers.getWithContact(msg.guild.id, m);
					if(!(mg && mg.length > 0)) {
						try {
							await msg.guild.removeMemberRole(m, conf.reprole)
						} catch(e) {
							console.log(e);
						}
					}
				}
			}
		}
		
		return "Contact updated!";
	},
	subcommands: {},
	alias: ["con","c"],
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.add = {
	help: ()=> "Adds contact(s) to a server. User IDs should be space delimited.",
	usage: ()=> [" [servID] [usrID] [usrID]... - Adds contact(s) to the server."],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a server ID and contact";
		let guild = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!guild) return "That server doesn't exist!";
		
		var dat = await bot.utils.verifyUsers(bot, args.slice(1).join(" ").replace(/[<@!>]/g,"").split(" "));
		var old = guild.contact_id || [];
		dat.pass = dat.pass.filter(x => !old.includes(x));
		try {
			guild = await bot.stores.servers.update(msg.guild.id, args[0], {contact_id: old.concat(dat.pass)});
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, args[0], guild);
		} catch(e) {
			return "ERR: "+e;
		}

		var conf = await bot.stores.configs.get(msg.guild.id);
		if(!conf) return;
		if(!conf.reprole) return;
		for(var m of dat.pass) {
			console.log(m);
			try {
				await msg.guild.addMemberRole(m, conf.reprole)
			} catch(e) {
				console.log(e);
			}
		}
		
		return "Contacts updated!";
	},
	permissions: ["manageMessages"],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a contact from a server",
	usage: ()=> [" [servID] [usrID] - Removes a contact from a server"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a server ID and contact";
		let memberid = args[1].replace(/[<@!>]/g, "");
		let guild = await bot.stores.servers.get(msg.guild.id, args[0]);

		if(!guild) return "That server doesn't exist!";
		if(!guild.contact_id || !guild.contact_id[0]) return "Guild has no contacts!";
		try {
			var contacts = guild.contact_id.filter(c => c!= memberid);
			guild = await bot.stores.servers.update(msg.guild.id, args[0], {contact_id: contacts[0] ? contacts : null});
			await bot.stores.serverPosts.updateByHostedServer(msg.guild.id, args[0], guild);
		} catch(e) {
			return "ERR: "+e;
		}

		var conf = await bot.stores.configs.get(msg.guild.id);
		if(!conf) return;
		if(!conf.reprole) return;
		var mg = await bot.stores.servers.getWithContact(msg.guild.id, memberid);
		if(!(mg && mg.length > 0)) {
			try {
				await msg.guild.removeMemberRole(memberid, conf.reprole)
			} catch(e) {
				console.log(e);
			}
		}
		
		return "Contacts updated!";
	},
	permissions: ["manageMessages"],
	guildOnly: true
}