const Eris 		= require("eris-additions")(require("eris"));
const dblite 	= require("dblite");
const fs 		= require("fs");

require('dotenv').config();

const bot 	= new Eris(process.env.TOKEN, {restMode: true});

bot.db		= dblite('data.sqlite',"-header");

bot.utils = require('./utilities')

bot.CHARS = process.env.CHARS;

bot.prefix		= process.env.PREFIX;

bot.fetch = require('node-fetch');

bot.commands	= {};

bot.customActions = [
	{name: "member.hr", replace: "msg.member.hasRole"},
	{name: "member.rr", replace: "await msg.member.removeRole"},
	{name: "member.ar", replace: "await msg.member.addRole"},
	{name: "rf\\(('.*')\\)", replace: "msg.guild.roles.find(r => r.name.toLowerCase() == $1.toLowerCase()).id", regex: true}
]

bot.status = 0;

const updateStatus = function(){
	switch(bot.status){
		case 0:
			bot.editStatus({name: "ha!h | in "+bot.guilds.size+" guilds!"});
			bot.status++;
			break;
		case 1:
			bot.editStatus({name: "ha!h | serving "+bot.users.size+" users!"});
			bot.status++;
			break;
		case 2:
			bot.editStatus({name: "ha!h | website: alex.greysdawn.com"});
			bot.status = 0;
			break;
	}

	setTimeout(()=> updateStatus(),600000)
}

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

async function setup() {
	bot.db.query(`CREATE TABLE IF NOT EXISTS servers (
		id         	INTEGER PRIMARY KEY AUTOINCREMENT,
		host_id 	BIGINT,
        server_id   BIGINT,
        contact_id  TEXT,
        name        TEXT,
        description TEXT,
        invite		TEXT,
        pic_url     TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS posts (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        host_id 	BIGINT,
        server_id   BIGINT,
        channel_id  BIGINT,
        message_id  BIGINT
    )`);

    bot.db.query(`CREATE TABLE IF NOT EXISTS configs (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id   	BIGINT,
        banlog_channel	BIGINT,
        reprole 		BIGINT,
        delist_channel	BIGINT,
        starboard 		TEXT,
        blacklist 		TEXT
    )`);

    bot.db.query(`CREATE TABLE IF NOT EXISTS reactroles (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
    	server_id		BIGINT,
    	role_id 		BIGINT,
    	emoji 			TEXT,
    	description 	TEXT
    )`);

    bot.db.query(`CREATE TABLE IF NOT EXISTS reactcategories (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
    	hid 			TEXT,
    	server_id		BIGINT,
    	name 			TEXT,
    	description 	TEXT,
    	roles 			TEXT,
    	posts 			TEXT
    )`);

    bot.db.query(`CREATE TABLE IF NOT EXISTS reactposts (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		channel_id	TEXT,
		message_id	TEXT,
		roles		TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS commands (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	BIGINT,
		name 		TEXT,
		actions 	TEXT,
		`+'`delete`'+` 		INTEGER
	)`)

	bot.db.query(`CREATE TABLE IF NOT EXISTS starboard (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	BIGINT,
		channel_id	BIGINT,
		message_id 	BIGINT,
		original_id BIGINT,
		emoji 		TEXT
	)`) //emoji is to keep track of posts from multiple boards

	bot.db.query(`CREATE TABLE IF NOT EXISTS banlogs (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		server_id 	TEXT,
		channel_id 	TEXT,
		message_id 	TEXT
	)`)

	bot.db.query(`CREATE TABLE IF NOT EXISTS receipts (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		server_id 	TEXT,
		message		TEXT
	)`)

	var files = fs.readdirSync("./commands");
	await Promise.all(files.map(f => {
		bot.commands[f.slice(0,-3)] = require("./commands/"+f);
		return new Promise((res,rej)=>{
			setTimeout(res("a"),100)
		})
	})).then(()=> console.log("finished loading commands."));
}

bot.asyncForEach = async (arr, bot, msg, args, cb) => {
	for (let i = 0; i < arr.length; i++) {
	    await cb(bot, msg, args, arr[i], i, arr);
	  }
}

bot.parseCommand = async function(bot, msg, args, command) {
	return new Promise(async (res,rej)=>{
		var commands;
		var cmd;
		var name = "";
		if(command) {
			commands = command.subcommands || [];
		} else {
			commands = bot.commands;
		}

		if(args[0] && commands[args[0].toLowerCase()]) {
			cmd = commands[args[0].toLowerCase()];
			name = args[0].toLowerCase();
			args = args.slice(1);
		} else if(args[0] && Object.values(commands).find(cm => cm.alias && cm.alias.includes(args[0].toLowerCase()))) {
			cmd = Object.values(commands).find(cm => cm.alias && cm.alias.includes(args[0].toLowerCase()));
			name = args[0].toLowerCase();
			args = args.slice(1);
		} else if(!cmd) {
			res(undefined);
		}

		if(cmd && cmd.subcommands && args[0]) {
			let data = await bot.parseCommand(bot, msg, args, cmd);
			if(data) {
				cmd = data[0]; args = data[1];
				name += " "+data[2];
			}
		}

		res([cmd, args, name]);
	})
}

bot.parseCustomCommand = async function(bot, msg, args) {
	return new Promise(async res => {
		if(!args || !args[0]) return res(undefined);
		var name = args.shift();
		var cmd = await bot.utils.getCustomCommand(bot, msg.guild.id, name);
		if(!cmd) return res(undefined);

		cmd.newActions = [];

		cmd.actions.forEach(action => {
			switch(action.type) {
				case "if":
					var condition = action.condition;
					var ac = action.action;
					bot.customActions.forEach(ca => {
						var n = ca.regex ? new RegExp(ca.name) : ca.name;
						condition = condition.replace(n, ca.replace)
						ac = ac.replace(n, ca.replace);
					})
					cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
						`if(${condition}) ${ac};`
					), action.success, action.fail]);
					break;
				case "if:else":
					var condition = action.condition;
					var tr = action.action[0];
					var fls = action.action[1];
					bot.customActions.forEach(ca => {
						var n = ca.regex ? new RegExp(ca.name) : ca.name;
						condition = condition.replace(n, ca.replace)
						tr = tr.replace(n, ca.replace);
						fls = fls.replace(n, ca.replace);
					})

					cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
						`if(${condition}) ${tr};
						 else ${fls}`
					), action.success, action.fail]);
					break;
				case "rr":
					var ac = action.action;
					bot.customActions.forEach(ca => {
						var n = ca.regex ? new RegExp(ca.name) : ca.name;
						ac = ac.replace(n, ca.replace);
					})
					cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
						`${ac}`
					), action.success, action.fail]);
					break;
				case "ar":
					var ac = action.action;
					bot.customActions.forEach(ca => {
						var n = ca.regex ? new RegExp(ca.name) : ca.name;
						ac = ac.replace(n, ca.replace);
					})
					cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
						`${ac}`
					), action.success, action.fail]);
					break;
			}
		})

		cmd.execute = async (bot, msg, args, cmd) => {
			let msgs = [];
			await bot.asyncForEach(cmd.newActions, bot, msg, args, async (bot, msg, args, a) => {
				console.log(a);
				try {
					await a[0].call(null, bot, msg, args);
				} catch (e) {
					if(e) console.log(e);
					if(a[2]) return await channel.createMessage(a[2] +`\n${e.message}`).then(message => {msgs.push(message)})
				}
				console.log("did the thing")
				if(a[1]) await msg.channel.createMessage(a[1]).then(message => {
					msgs.push(message);
				})
			})
			console.log("test");
			if(cmd.delete) {
				setTimeout(async ()=> {
					await msg.delete();
					console.log(msgs);
					await Promise.all(msgs.map(async m => {
						console.log(m);
						await m.delete()
						return new Promise(res => res(""))
					}))
				}, 2000)
				
			}

			console.log(msgs);
			
		}

		res([cmd, args, name])
	})
}

bot.commands.help = {
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
					description: [
						`${cmd.help()}\n\n`,
						`**Usage**\n${cmd.usage().map(c => `**${bot.prefix + names.join(" ")}**${c}`).join("\n")}\n\n`,
						`**Aliases:** ${cmd.alias ? cmd.alias.join(", ") : "(none)"}\n\n`,
						`**Subcommands**\n${cmd.subcommands ?
							Object.keys(cmd.subcommands).map(sc => `**${bot.prefix}${sc}** - ${cmd.subcommands[sc].help()}`).join("\n") : 
							"(none)"}`
					].join(""),
					footer: {
						icon_url: bot.user.avatarURL,
						text: "Arguments like [this] are required, arguments like <this> are optional."
					}
				}
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

bot.on("ready",()=>{
	console.log("Ready");
	updateStatus();
})

bot.on("messageCreate",async (msg)=>{
	if(msg.author.bot) return;
	if(!msg.guild) return msg.channel.createMessage("This bot is intended to be used in guilds only :(");
	var prefix = new RegExp("^"+bot.prefix, "i");
	if(!msg.content.toLowerCase().match(prefix)) return;
	let args = msg.content.replace(prefix, "").split(" ");
	let cmd = await bot.parseCommand(bot, msg, args);
	if(!cmd) cmd = await bot.parseCustomCommand(bot, msg, args);
	console.log(cmd);
	if(cmd) {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(cfg && cfg.blacklist && cfg.blacklist.includes(msg.author.id)) return msg.channel.createMessage("You have been banned from using this bot.");
		if(!cmd[0].permissions || (cmd[0].permissions && cmd[0].permissions.filter(p => msg.member.permission.has(p)).length == cmd[0].permissions.length)) {
			cmd[0].execute(bot, msg, cmd[1], cmd[0]);
		} else {
			msg.channel.createMessage("You do do not have permission to do this.")
		}
		
	}
	else msg.channel.createMessage("Command not found.");
});

bot.on("messageReactionAdd", async (msg, emoji, user)=>{
	if(bot.user.id == user) return;
	if(!msg.channel.guild) return;
	if(bot.pages && bot.pages[msg.id] && bot.pages[msg.id].user == user) {
		if(emoji.name == "\u2b05") {
			if(bot.pages[msg.id].index == 0) {
				bot.pages[msg.id].index = bot.pages[msg.id].data.length-1;
			} else {
				bot.pages[msg.id].index -= 1;
			}
			bot.editMessage(msg.channel.id, msg.id, bot.pages[msg.id].data[bot.pages[msg.id].index]);
			try {
				bot.removeMessageReaction(msg.channel.id, msg.id, emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, user);
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("I can't remove reactions :(");
			}
		} else if(emoji.name == "\u27a1") {
			if(bot.pages[msg.id].index == bot.pages[msg.id].data.length-1) {
				bot.pages[msg.id].index = 0;
			} else {
				bot.pages[msg.id].index += 1;
			}
			bot.editMessage(msg.channel.id, msg.id, bot.pages[msg.id].data[bot.pages[msg.id].index]);
			try {
				bot.removeMessageReaction(msg.channel.id, msg.id, emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, user);
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("I can't remove reactions :(");
			}
		} else if(emoji.name == "\u23f9") {
			bot.deleteMessage(msg.channel.id, msg.id);
			delete bot.pages[msg.id];
		}
	}

	var cfg = await bot.utils.getConfig(bot, msg.channel.guild.id);
	if(cfg && cfg.blacklist && cfg.blacklist.includes(user)) return;
	if(cfg && cfg.starboard && cfg.starboard.boards) {
		var em;
		if(emoji.id) em = `:${emoji.name}:${emoji.id}`;
		else em = emoji.name; 
		var cf = cfg.starboard.boards.find(c => c.emoji == em);
		if(cf) {
			var sbpost = await bot.utils.getStarPost(bot, msg.channel.guild.id, msg.id, em);
			var message = await bot.getMessage(msg.channel.id, msg.id);
			if(!sbpost) {
				console.log(em);
				var chan = cf.channel;
				var member = msg.channel.guild.members.find(m => m.id == user);
				var tolerance = cf.tolerance ? cf.tolerance : (cfg.starboard.tolerance || 2);
				if((member.permission.has("manageMessages") && cfg.starboard.override) || (message.reactions[em.replace(/^:/,"")].count === tolerance)) {
					bot.utils.starMessage(bot, message, chan, {emoji: em, count: message.reactions[em.replace(/^:/,"")].count})
				}
			} else {
				await bot.utils.updateStarPost(bot, msg.channel.guild.id, msg.id, {emoji: em, count: message.reactions[em.replace(/^:/,"")].count})
			}
		}
	}

	var post = await bot.utils.getReactionRolePost(bot, msg.channel.guild.id, msg.id);
	var message = await bot.getMessage(msg.channel.id, msg.id);
	if(post) {
		var role = post.roles.find(r => (emoji.id ? r.emoji == `:${emoji.name}:${emoji.id}` || r.emoji == `a:${emoji.name}:${emoji.id}` : r.emoji == emoji.name));
		if(!role) return;
		var rl = msg.channel.guild.roles.find(r => r.id == role.role_id);
		if(!rl) return;
		var member = msg.channel.guild.members.find(m => m.id == user);
		if(!member) return;
		if(member.roles.includes(rl.id)) {
			try {
				msg.channel.guild.removeMemberRole(user, rl.id);
				bot.removeMessageReaction(msg.channel.id, msg.id, emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, user);
			} catch(e) {
				console.log(e);
				await bot.getDMChannel(user).then(ch => {
					ch.createMessage(`Couldn't give you role **${rl.name}** in ${msg.channel.guild.name}. Please let a moderator know that something went wrong`)
				})
			}
		} else {
			try {
				msg.channel.guild.addMemberRole(user, rl.id);
				bot.removeMessageReaction(msg.channel.id, msg.id, emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, user);
			} catch(e) {
				console.log(e);
				await bot.getDMChannel(user).then(ch => {
					ch.createMessage(`Couldn't give you role **${rl.name}** in ${msg.channel.guild.name}. Please let a moderator know that something went wrong`)
				})
			}
		}
	}

	if(emoji.name == "\u2753" || emoji.name == "\u2754") {
		var log = await bot.utils.getBanLogByMessage(bot, msg.channel.guild.id, msg.channel.id, msg.id);
		if(!log) return;

		var receipt = await bot.utils.getReceipt(bot, log.hid, msg.channel.guild.id);
		if(!receipt) return;

		var ch = await bot.getDMChannel(user);
		if(!ch) return;

		var users = await bot.utils.verifyUsers(bot, log.embed.fields[1].value.split("\n"));

		try {
			ch.createMessage({embed: {
				title: "Ban Receipt",
				description: receipt.message,
				fields: [
					{name: "Users Banned", value: users.info.map(u => `${u.username}#${u.discriminator} (${u.id})`).concat(users.fail.map(u => `${u} - Member deleted?`)).join("\n")},
					{name: "Reason", value: log.embed.fields[2].value}
				]
			}})
			bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name, user);
		} catch(e) {
			console.log(e);
		}
	}
});

bot.on("messageReactionRemove", async (msg, emoji, user) => {
	if(bot.user.id == user) return;

	var cfg = await bot.utils.getConfig(bot, msg.channel.guild.id);
	if(cfg && cfg.blacklist && cfg.blacklist.includes(user)) return;

	var em;
	if(emoji.id) em = `:${emoji.name}:${emoji.id}`;
	else em = emoji.name;

	var message = await bot.getMessage(msg.channel.id, msg.id);
	await bot.utils.updateStarPost(bot, msg.channel.guild.id, msg.id, {emoji: em, count: message.reactions[em.replace(/^:/,"")] ? message.reactions[em.replace(/^:/,"")].count : 0})
})

bot.on("messageDelete", async (msg) => {
	bot.db.query(`DELETE FROM reactposts WHERE server_id=? AND channel_id=? AND message_id=?`,[msg.channel.guild.id, msg.channel.id, msg.id]);
})

setup();
bot.connect();
