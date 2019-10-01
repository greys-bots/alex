module.exports = {
	help: ()=> "Sets, adds, or removes contact(s) for a server.",
	usage: ()=> [" [server_id] [user_id/mention] - Sets server contact(s).",
				 " add [server_id] [user_id/mention] - Adds server contact(s).",
				 " remove [server_id] [user_id/mention] - Removes server contact. *(only one at a time, for ease)*"
				],
	execute: async (bot, msg, args)=>{
		if(!args[1]) return msg.channel.createMessage("Please provide a server ID and contact.");
		let guild = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(!guild) return msg.channel.createMessage("That server does not exist.");

		var dat = await bot.utils.verifyUsers(bot, msg.mentions.length > 0 ? msg.mentions.map(m => m.id) : args.slice(1));
		
		bot.db.query(`UPDATE servers SET contact_id = ? WHERE server_id = ?`,[dat.pass.join(" "), guild.server_id],(err,res)=>{
			if(err) {
				console.log(err);
				msg.channel.createMessage("There was an error.");
			} else {
				console.log(dat);
				msg.channel.createMessage("Contact updated!" + (dat.fail.length > 0 ? '\nFollowing contacts not added (users do not exist):\n'+dat.fail.join("\n") : ""));
			}
		})

		var res2 = await bot.utils.updatePosts(bot, msg.guild.id, args[0]);
		if(!res2) {
			msg.channel.createMessage('Something went wrong while updating post')
		}

		var conf = await bot.utils.getConfig(bot, msg.guild.id);
		if(!conf) return;
		if(!conf.reprole) return;
		console.log(conf.reprole)
		await Promise.all(dat.pass.map(async m => {
			try {
				await msg.guild.addMemberRole(m, conf.reprole)
				return new Promise(res => setTimeout(()=> res(1), 100))
			} catch(e) {
				console.log(e);
			}
		}))

		if(guild.contact_id == "" || !guild.contact_id) return;
		await Promise.all(guild.contact_id.split(" ").map(async m => {
			var mg = await bot.utils.getServersWithContact(bot, msg.guild.id, m);
			console.log(m + "\n\n"+JSON.stringify(mg));
			if(!(mg && mg.length > 0)) {
				try {
					await msg.guild.removeMemberRole(m, conf.reprole)
					return new Promise(res => setTimeout(()=> res(1), 100))
				} catch(e) {
					console.log(e);
				}
			}
		}))
	},
	subcommands: {},
	alias: ["con","c"],
	permissions: ["manageMessages"]
}

module.exports.subcommands.add = {
	help: ()=> "Adds contact(s) to a server. User IDs should be space delimited.",
	usage: ()=> [" [servID] [usrID] [usrID]... - Adds contact(s) to the server."],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a server ID and contact.");
		let guild = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(!guild) return msg.channel.createMessage("That server does not exist.");

		var dat = await bot.utils.verifyUsers(bot, msg.mentions.length > 0 ? msg.mentions.map(m => m.id) : args.slice(1));
		
		bot.db.query(`UPDATE servers SET contact_id = ? WHERE server_id = ?`,[guild.contact_id + " " + dat.pass.join(" "), guild.server_id],(err,res)=>{
			if(err) {
				console.log(err);
				msg.channel.createMessage("There was an error.");
			} else {
				console.log(dat);
				msg.channel.createMessage("Contact updated!" + (dat.fail.length > 0 ? '\nFollowing contacts not added (users do not exist):\n'+dat.fail.join("\n") : ""));
			}
		})

		var res2 = await bot.utils.updatePosts(bot, msg.guild.id, args[0]);
		if(!res2) {
			msg.channel.createMessage('Something went wrong while updating post')
		}

		var conf = await bot.utils.getConfig(bot, msg.guild.id);
		if(!conf) return;
		if(!conf.reprole) return;
		await Promise.all(dat.pass.map(async m => {
			try {
				await msg.guild.addMemberRole(m, conf.reprole)
				return new Promise(res => setTimeout(()=> res(1), 100))
			} catch(e) {
				console.log(e);
			}
		}))
	},
	permissions: ["manageMessages"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a contact from a server.",
	usage: ()=> [" [servID] [usrID] - Removes one (1) contact from the server."],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a server ID and contact.");
		let memberid = (msg.mentions.length > 0 ? msg.mentions[0].id : args[1]);
		let guild = await bot.utils.getServer(bot, msg.guild.id, args[0]);

		if(!guild) return msg.channel.createMessage("That server does not exist.");
		bot.db.query(`UPDATE servers SET contact_id = ? WHERE server_id = ?`,[guild.contact_id.split(" ").filter(c => c!= memberid).join(" "), guild.server_id],(err,res)=>{
			if(err) {
				console.log(err);
				msg.channel.createMessage("There was an error.");
			} else {
				console.log(res);
				msg.channel.createMessage("Contact updated!");
			}
		})

		bot.db.query(`SELECT * FROM servers WHERE contact_id LIKE ?`,["%"+memberid+"%"], async (err, rows)=> {
			if(err) {
				console.log(err);
			} else {
				if(!rows[0]) {
					var conf = await bot.utils.getConfig(bot, msg.guild.id);
					if(!conf) return;
					if(!conf.reprole) return;
					try {
						await msg.guild.removeMemberRole(memberid, conf.reprole);
					} catch(e) {
						console.log(e)
					}
				}
			}
		})

		var res2 = await bot.utils.updatePosts(bot, msg.guild.id, args[0]);
		if(!res2) {
			msg.channel.createMessage('Something went wrong while updating post')
		}
	},
	permissions: ["manageMessages"]
}