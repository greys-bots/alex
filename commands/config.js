module.exports = {
	help: ()=> "Sets configs for the server.",
	usage: ()=> [" banlog [channel] - Sets banlog channel for the server"],
	execute: async (bot, msg, args)=> {
		var conf = await bot.utils.getConfig(bot, msg.guild.id);
		var textconf = "";
		if(!conf) return msg.channel.createMessage('Config not found.');
		if(conf.banlog_channel) {
			var chan = msg.guild.channels.find(c => c.id == conf.banlog_channel);
			if(chan) {
				textconf+="Banlog channel: "+chan.mention+"\n";
			} else {
				textconf+="Banlog channel: (not provided)\n";
			}
		} else {
			textconf+="Banlog channel: (not provided)\n";
		}

		if(conf.reprole) {
			var role = msg.guild.roles.find(rl => rl.id == conf.reprole);
			if(role) {
				textconf+="Represenative role: "+role.mention+"\n";
			} else {
				textconf+="Representative role: (not provided)\n";
			}
		} else {
			textconf+="Representative role: (not provided)\n";
		}

		if(conf.delist_channel) {
			chan = msg.guild.channels.find(ch => ch.id == conf.delist_channel);
			if(chan) {
				textconf+="Delist channel: "+chan.mention+"\n";
			} else {
				textconf+="Delist channel: (not provided)\n";
			}
		} else {
			textconf+="Delist channel: (not provided)\n";
		}

		msg.channel.createMessage(`Current configs:\n`+textconf);
	},
	alias: ['conf'],
	subcommands: {},
	permissions: ["manageMessages"]
}

module.exports.subcommands.banlog = {
	help: ()=> "Sets banlog channel",
	usage: ()=> [" [channel] - Sets banlog channel for the server (NOTE: can be channel ID, channel mention, or channel name"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage('Please provide a channel.');
		var chan = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[0]);

		var conf = await bot.utils.getConfig(bot, msg.guild.id);

		if(conf) {
			bot.db.query(`UPDATE configs SET banlog_channel=? WHERE server_id=?`,[chan.id, msg.guild.id],(err,rows)=>{
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong.')
				} else {
					msg.channel.createMessage('Banlog channel set!');
				}
			})
		} else {
			bot.db.query(`INSERT INTO configs (server_id, banlog_channel) VALUES (?,?)`,[
					msg.guild.id,
					chan.id
			],(err,rows)=>{
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong.')
				} else {
					msg.channel.createMessage('Banlog channel set!');
				}
			})
		}
	},
	alias: ['banchannel', "banlogs", "banlogchannel"],
	permissions: ["manageMessages"]
}

module.exports.subcommands.reprole = {
	help: ()=> "Sets server rep role",
	usage: ()=> [" [role] - Sets rep role for the server (NOTE: can be role ID, role mention, or role name"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage('Please provide a channel.');
		var role = msg.roleMentions.length > 0 ?
				   msg.guild.roles.find(rl => rl.id == msg.roleMentions[0]) :
				   msg.guild.roles.find(rl => rl.id == args[0] || rl.name.toLowerCase() == args.join(" ").toLowerCase());

		var conf = await bot.utils.getConfig(bot, msg.guild.id);

		if(conf) {
			bot.db.query(`UPDATE configs SET reprole=? WHERE server_id=?`,[role.id, msg.guild.id],(err,rows)=>{
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong.')
				} else {
					msg.channel.createMessage('Representative role set!');
				}
			})
		} else {
			bot.db.query(`INSERT INTO configs (server_id, reprole) VALUES (?,?)`,[
				msg.guild.id,
				role.id
			],(err,rows)=>{
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong.')
				} else {
					msg.channel.createMessage('Representative role set!');
				}
			})
		}
	},
	permissions: ["manageMessages"]
}

module.exports.subcommands.delist = {
	help: ()=> "Sets delist channel",
	usage: ()=> [" [channel] - Sets delist channel for the server (NOTE: can be channel ID, channel mention, or channel name"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage('Please provide a channel.');
		var chan = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[0]);

		var conf = await bot.utils.getConfig(bot, msg.guild.id);

		if(conf) {
			bot.db.query(`UPDATE configs SET delist_channel=? WHERE server_id=?`,[chan.id, msg.guild.id],(err,rows)=>{
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong.')
				} else {
					msg.channel.createMessage('Delist channel set!');
				}
			})
		} else {
			bot.db.query(`INSERT INTO configs (server_id, delist_channel) VALUES (?,?)`,[
					msg.guild.id,
					chan.id
			],(err,rows)=>{
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong.')
				} else {
					msg.channel.createMessage('Delist channel set!');
				}
			})
		}
	},
	alias: ['delistchannel', "delete", "delisting", "deletechannel", "denychannel", "deny"],
	permissions: ["manageMessages"]
}