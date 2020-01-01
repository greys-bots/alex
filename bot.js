const Eris 		= require("eris-additions")(require("eris"));
const dblite 	= require("dblite");
const fs 		= require("fs");

require('dotenv').config();

const bot 	= new Eris(process.env.TOKEN, {restMode: true});

bot.db		= dblite('data.sqlite',"-header");

bot.utils = require('./utilities')

bot.chars = process.env.CHARS;
bot.prefix = process.env.PREFIX;
bot.owner = process.env.OWNER;

bot.fetch = require('node-fetch');

bot.commands	= {};

bot.customActions = [
	{name: "member.hr", replace: "msg.member.hasRole"},
	{name: "member.rr", replace: "await msg.member.removeRole"},
	{name: "member.ar", replace: "await msg.member.addRole"},
	{name: "member.bl", replace: "await bot.commands.blacklist.execute(bot, msg, [msg.member.id])"},
	{name: "args.hr", replace: (arg) => "msg.guild.members.find(m => m.id == "+arg+").hasRole"},
	{name: "args.rr", replace: (arg) => "await msg.guild.members.find(m => m.id == "+arg+").removeRole"},
	{name: "args.ar", replace: (arg) => "await msg.guild.members.find(m => m.id == "+arg+").addRole"},
	{name: "args.bl", replace: (arg) => "await bot.commands.blacklist.subcommands.add.execute(bot, msg, [msg.guild.members.find(m => m.id == "+arg+").id])"},
	{name: "rf\\(('.*')\\)", replace: "msg.guild.roles.find(r => r.name.toLowerCase() == $1.toLowerCase()).id", regex: true}
]

bot.banVars = {
	"$REASON": "${reason}",
	"$SERVER.NAME": "${msg.guild.name}"
}

bot.logVars = {
	"$SERVER.NAME": '${guild.name || "(no name)"}'
}

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
	//database schema
	//FINALLY alphabetized

	bot.db.query(`CREATE TABLE IF NOT EXISTS ban_logs (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		server_id 	TEXT,
		channel_id 	TEXT,
		message_id 	TEXT,
		users 		TEXT,
		reason 		TEXT,
		timestamp 	TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS commands (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	BIGINT,
		name 		TEXT,
		actions 	TEXT,
		target 		TEXT,
		del 		INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS configs (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id   	BIGINT,
        banlog_channel	BIGINT,
        ban_message 	TEXT,
        reprole 		BIGINT,
        delist_channel	BIGINT,
        starboard 		TEXT,
        blacklist 		TEXT,
        feedback 		TEXT
    )`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS feedback (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid			TEXT,
		server_id	TEXT,
		sender_id 	TEXT,
		message 	TEXT,
		anon 		INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS listing_logs (
		id 				INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 			TEXT,
		server_id 		TEXT,
		channel_id 		TEXT,
		message_id 		TEXT,
		server_name 	TEXT,
		reason 			TEXT,
		timestamp 		TEXT,
		type 			INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS posts (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        host_id 	BIGINT,
        server_id   BIGINT,
        channel_id  BIGINT,
        message_id  BIGINT
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

    bot.db.query(`CREATE TABLE IF NOT EXISTS reactroles (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
    	server_id		BIGINT,
    	role_id 		BIGINT,
    	emoji 			TEXT,
    	description 	TEXT
    )`);

    bot.db.query(`CREATE TABLE IF NOT EXISTS reactposts (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		channel_id	TEXT,
		message_id	TEXT,
		roles		TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS receipts (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		server_id 	TEXT,
		message		TEXT,
		link		TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS servers(
		id         	INTEGER PRIMARY KEY AUTOINCREMENT,
		host_id 	BIGINT,
        server_id   BIGINT,
        contact_id  TEXT,
        name        TEXT,
        description TEXT,
        invite		TEXT,
        pic_url     TEXT,
        visibility  INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS starboard (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	BIGINT,
		channel_id	BIGINT,
		message_id 	BIGINT,
		original_id BIGINT,
		emoji 		TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS sync (
		id 				INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 		TEXT,
		sync_id 		TEXT,
		confirmed 		INTEGER,
		syncable 		INTEGER,
		sync_notifs 	TEXT,
		ban_notifs 		TEXT,
		enabled 		INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS sync_menus (
		id 				INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 		TEXT,
		channel_id 		TEXT,
		message_id 		TEXT,
		type 			INTEGER,
		reply_guild 	TEXT,
		reply_channel 	TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS ticket_configs (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		category_id	TEXT,
		archives_id TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS ticket_posts (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		channel_id	TEXT,
		message_id	TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS tickets (
		id 				INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 			TEXT,
		server_id 		TEXT,
		channel_id		TEXT,
		first_message 	TEXT,
		opener 			TEXT,
		users 			TEXT,
		timestamp 		TEXT
	)`);

	//command loading
	var files = fs.readdirSync("./commands");
	await Promise.all(files.map(f => {
		bot.commands[f.slice(0,-3)] = require("./commands/"+f);
		return new Promise((res,rej)=>{
			setTimeout(res("a"),100)
		})
	})).then(()=> console.log("finished loading commands."));
}

bot.formatTime = (date) => {
	if(typeof date == "string") date = new Date(date);

	return `${(date.getMonth()+1) < 10 ? "0"+(date.getMonth()+1) : (date.getMonth()+1)}.${(date.getDate()) < 10 ? "0"+(date.getDate()) : (date.getDate())}.${date.getFullYear()} at ${date.getHours() < 10 ? "0"+date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes()}`
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
		if(!msg.guild) return res(undefined);
		var name = args.shift();
		var cmd = await bot.utils.getCustomCommand(bot, msg.guild.id, name);
		if(!cmd) return res(undefined);

		cmd.newActions = [];

		cmd.actions.forEach(action => {
			if(cmd.target == "member") {
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
					case "bl":
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
			} else {
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
						args.forEach(arg => {
							var ac = action.action;
							bot.customActions.forEach(ca => {
								var n = ca.regex ? new RegExp(ca.name) : ca.name;
								ac = ac.replace(n, typeof ca.replace == "function" ? ca.replace(arg) : ca.replace);
							})
							cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
								`${ac}`
							), action.success, action.fail]);
						})
						break;
					case "ar":
						args.forEach(arg => {
							var ac = action.action;
							bot.customActions.forEach(ca => {
								var n = ca.regex ? new RegExp(ca.name) : ca.name;
								ac = ac.replace(n, typeof ca.replace == "function" ? ca.replace(arg) : ca.replace);
							})
							cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
								`${ac}`
							), action.success, action.fail]);
						})
						break;
					case "bl":
						args.forEach(arg => {
							var ac = action.action;
							bot.customActions.forEach(ca => {
								var n = ca.regex ? new RegExp(ca.name) : ca.name;
								ac = ac.replace(n, typeof ca.replace == "function" ? ca.replace(arg) : ca.replace);
							})
							cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
								`${ac}`
							), action.success, action.fail]);
						})
						break;
				}
			}
		})

		cmd.execute = async (bot, msg, args, cmd) => {
			let msgs = [];
			await bot.asyncForEach(cmd.newActions, bot, msg, args, async (bot, msg, args, a) => {
				try {
					await a[0].call(null, bot, msg, args);
				} catch (e) {
					if(e) console.log(e);
					if(a[2]) return await msg.channel.createMessage(a[2] +`\n${e.message}`).then(message => {msgs.push(message)})
				}
				if(a[1]) await msg.channel.createMessage(a[1]).then(message => {
					msgs.push(message);
				})
			})
			if(cmd.del) {
				setTimeout(async ()=> {
					await msg.delete();
					await Promise.all(msgs.map(async m => {
						await m.delete()
						return new Promise(res => res(""))
					}))
				}, 2000)
				
			}
			
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
				var fields = [
					{name: "**Usage**", value: `${cmd.usage().map(c => `**${bot.prefix + names.join(" ")}**${c}`).join("\n")}`},
					{name: "**Aliases**", value: `${cmd.alias ? cmd.alias.join(", ") : "(none)"}`},
					{name: "**Subcommands**", value: `${cmd.subcommands ?
							Object.keys(cmd.subcommands).map(sc => `**${bot.prefix}${dat[2]} ${sc}** - ${cmd.subcommands[sc].help()}`).join("\n") : 
							"(none)"}`}
				];
				if(cmd.desc) fields.push({name: "**Extra**", value: `${cmd.desc()}`});
				embed = {
					title: `Help | ${names.join(" - ").toLowerCase()}`,
					description: `${cmd.help()}\n\n`,
					fields: fields,
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
	// if(!msg.guild) return msg.channel.createMessage("This bot should be used in guilds only");
	var prefix = new RegExp("^"+bot.prefix, "i");
	if(!msg.content.toLowerCase().match(prefix)) return;
	let args = msg.content.replace(prefix, "").split(" ");
	let cmd = await bot.parseCommand(bot, msg, args);
	if(!cmd) cmd = await bot.parseCustomCommand(bot, msg, args);
	console.log(cmd);
	if(cmd) {

		var cfg = msg.guild ? await bot.utils.getConfig(bot, msg.guild.id) : {};
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

	if(bot.menus && bot.menus[msg.id] && bot.menus[msg.id].user == user) {
		try {
			await bot.menus[msg.id].execute(bot, msg, emoji);
		} catch(e) {
			console.log(e);
			writeLog(e);
			msg.channel.createMessage("Something went wrong: "+e.message);
		}
	}

	if(!msg.channel.guild) return;

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

	var message;
	try {
		message = await bot.getMessage(msg.channel.id, msg.id);
	} catch(e) {
		if(!(e.stack.includes("Unknown Message") && emoji.name == "\u23f9")) console.log(e);
		return;
	}

	var smenu = await bot.utils.getSyncMenu(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	if(smenu) {
		if(!["✅", "❌"].includes(emoji.name)) return;
		var request = await bot.utils.getSyncRequest(bot, msg.channel.guild.id, smenu.reply_guild);
		if(!request) return;
		if(message) var embed = message.embeds[0];
		var member = await bot.utils.fetchUser(bot, user);
		switch(emoji.name) {
			case "✅":
				if(request.confirmed) {
					try {
						await message.removeReaction("✅", user);
					} catch(e) {
						console.log(e)
					}
					return;
				}

				try {
					if(embed) {
						embed.fields[2].value = "Confirmed";
						embed.color = parseInt("55aa55", 16);
						embed.author = {
							name: `Accepted by: ${member.username}#${member.discriminator} (${member.id})`,
							icon_url: member.avatarURL
						}
						await bot.editMessage(message.channel.id, message.id, {embed: embed});
						await message.removeReactions();
					}
				} catch(e) {
					console.log(e);
					message.channel.createMessage("Notification for this request couldn't be updated; the request can still be confirmed, however");
				}

				var scc = await bot.utils.updateSyncConfig(bot, smenu.reply_guild, {confirmed: true});
				if(scc) {
					try {
						await bot.createMessage(smenu.reply_channel, {embed: {
							title: "Sync Acceptance",
							description: `Your sync request with ${message.guild.name} has been accepted!`,
							color: parseInt("55aa55", 16),
							timestamp: new Date().toISOString()
						}});
					} catch(e) {
						console.log(e);
						message.channel.createMessage("Couldn't send the requester the acceptance notification; please make sure they're aware that their server was accepted and that they should use `hub!ban notifs [channel]` if they want ban notifications")
					}
				} else message.channel.createMessage("Something went wrong while updating the request. Please try again");
				break;
			case "❌":
				if(!request.confirmed) {
					try {
						await message.removeReaction("❌", user);
					} catch(e) {
						console.log(e)
					}
					return;
				}

				try {
					if(embed) {
						embed.fields[2].value = "Denied";
						embed.color = parseInt("aa5555", 16);
						embed.author = {
							name: `Denied by: ${member.username}#${member.discriminator} (${member.id})`,
							icon_url: member.avatarURL
						}
						await bot.editMessage(message.channel.id, message.id, {embed: embed});
						await message.removeReactions();
						await bot.utils.deleteSyncMenu(bot, message.channel.guild.id, message.channel.id, message.id);
					}
				} catch(e) {
					console.log(e);
					message.channel.createMessage("Notification for this request couldn't be updated; the request can still be denied, however");
				}

				var scc = await bot.utils.updateSyncConfig(bot, smenu.reply_guild, {confirmed: true});
				if(scc) {
					try {
						await bot.createMessage(smenu.reply_channel, {embed: {
							title: "Sync Denial",
							description: `Your sync request with ${message.guild.name} has been denied.${request.confirmed ? " You'll no longer receive notifications from this server." : ""}`,
							color: parseInt("aa5555", 16),
							timestamp: new Date().toISOString()
						}});
					} catch(e) {
						console.log(e);
						message.channel.createMessage("Couldn't send the requester the acceptance notification; please make sure they're aware that their server was accepted")
					}
				} else message.channel.createMessage("Something went wrong while updating the request. Please try again");
				break;
		}
	}

	var post = await bot.utils.getReactionRolePost(bot, msg.channel.guild.id, msg.id);
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

		var ch = await bot.getDMChannel(user);
		if(!ch) return;

		var receipt = await bot.utils.getReceipt(bot, log.hid, msg.channel.guild.id);
		if(!receipt) return ch.channel.createMessage("No receipt has been registered for that ban :(");

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

	var tpost = await bot.utils.getTicketPost(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	if(tpost) {
		await bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name, user);
		var ch = await bot.getDMChannel(user);
		var tickets = await bot.utils.getSupportTicketsByUser(bot, msg.channel.guild.id, user);
		if(tickets && tickets.length >= 5) {
			try {
				return ch.createMessage("Couldn't open ticket: you already have 5 open for that server")
			} catch(e) {
				console.log(e);
				return;
			}
		}
		var us = await bot.utils.fetchUser(bot, user);
		var ticket = await bot.utils.createSupportTicket(bot, msg.channel.guild.id, us);
		if(!ticket.hid) {
			try {
				ch.createMessage("Couldn't open your support ticket:\n"+ticket.err);
			} catch(e) {
				console.log(e);
				return;
			}	
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

	try {
		var message = await bot.getMessage(msg.channel.id, msg.id);
		await bot.utils.updateStarPost(bot, msg.channel.guild.id, msg.id, {emoji: em, count: message.reactions[em.replace(/^:/,"")] ? message.reactions[em.replace(/^:/,"")].count : 0})
	} catch(e) {
		console.log("Error attempting to get message/update starboard post:\n"+e.stack);
	}
})

bot.on("messageDelete", async (msg) => {
	if(!msg.channel.guild) return;
	try {
		bot.db.query(`DELETE FROM reactposts WHERE server_id=? AND channel_id=? AND message_id=?`,[msg.channel.guild.id, msg.channel.id, msg.id]);
		await bot.utils.deleteTicketPost(bot, msg.channel.guild.id, msg.channel.id, msg.id);
		await bot.utils.deletePost(bot, msg.channel.guild.id, msg.id);

		var log
		log = await bot.utils.getRawBanLogByMessage(bot, msg.channel.guild.id, msg.channel.id, msg.id);
		if(log) await bot.utils.deleteBanLog(bot, log.hid, msg.channel.guild.id);

		log = await bot.utils.getRawListingLogByMessage(bot, msg.channel.guild.id, msg.channel.id, msg.id);
		if(log) await bot.utils.deleteListingLog(bot, log.hid, msg.channel.guild.id);
	} catch(e) {
		console.log("Error deleting a log:\n"+e.stack);
	}
})

bot.on("channelDelete", async (channel) => {
	try {
		await bot.utils.deleteSupportTicket(bot, channel.guild.id, channel.id);
	} catch(e) {
		console.log("Error deleting support ticket:\n"+e.stack)
	}
})

bot.on("guildDelete", async (guild) => {
	try {
		var data = await bot.utils.getExportData(bot, guild.id);
		var ch = await bot.getDMChannel(guild.ownerID);
		if(!ch) return;
		ch.createMessage(["Hi! I'm sending you this because you removed me from your server. ",
			"After 24 hours, all the data I have indexed for it will be deleted. ",
			"If you invite me back after 24 hours are up and would like to start up ",
			"where you left off, you can use this file to do so:"].join(""));
	} catch(e) {
		console.log("Error attempting to export/deliver data after being kicked:\n"+e.stack)
	}
})

bot.on("guildCreate", async (guild) => {
	var posts = await bot.utils.getPostsByServer(bot, guild.id);
	if(!posts) return;

	console.log("posts exist")
	for(var i = 0; i < posts.length; i++) {
		var message = await bot.getMessage(posts[i].channel_id, posts[i].message_id)
		if(!message) continue;
		var em = message.embeds[0];
		em.fields[2].value = guild.memberCount;
		await bot.editMessage(message.channel.id, message.id, {embed: em})
	}
})

bot.on("guildMemberAdd", async (guild, member) => {
	//update member count
	await bot.utils.updatePostsByServer(bot, guild.id);

	//notify current guild if the user is banned from their synced server
	var scfg = await bot.utils.getSyncConfig(bot, guild.id);
	if(!scfg || (!scfg.sync_id && !scfg.confirmed) || !scfg.ban_notifs) return;
	var log = await bot.utils.getBanLogByUser(bot, scfg.sync_id, member.id);
	if(log && log!="deleted") {
		try {
			await bot.createMessage(scfg.ban_notifs, {embed: {
				title: "Ban Notification",
				description: [
					`New member **${member.username}#${member.discriminator}** (${member.id})`,
					` has been banned from your currently synced server.\n`,
					`Reason:\n`,
					log.embed.fields[2].value
				].join(""),
				color: parseInt("aa5555", 16)
			}})
		} catch(e) {
			console.log(e);
		}
	}
})

bot.on("guildMemberRemove", async (guild, member) => {
	//also update member count
	await bot.utils.updatePostsByServer(bot, guild.id)
})

bot.on("guildUpdate", async (guild) => {
	var posts = await bot.utils.getPostsByServer(bot, guild.id);
	if(!posts) return;

	for(var i = 0; i < posts.length; i++) {
		var message;
		try {
			message = await bot.getMessage(posts[i].channel_id, posts[i].message_id)
		} catch(e) {
			console.log(e);
			continue;
		}

		var em = message.embeds[0];
		em.title = guild.name;
		em.thumbnail = {url: guild.iconURL};
		bot.editMessage(message.channel.id, message.id, {embed: em})
		bot.utils.updateServer(bot, guild.id, {name: guild.name, pic_url: guild.iconURL})
	}
})

setup();
bot.connect();
