const Eris 		= require("eris-additions")(require("eris"));
const dblite 	= require("dblite");
const fs 		= require("fs");
const path 		= require("path");	

require('dotenv').config();

const bot 		= new Eris(process.env.TOKEN, {restMode: true});

bot.utils 		= require('./utilities')

bot.chars 		= process.env.CHARS;
bot.prefix 		= process.env.PREFIX;
bot.owner 		= process.env.OWNER;

bot.fetch 		= require('node-fetch');

bot.commands 	= {};

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

//for command setup
const recursivelyReadDirectory = function(dir) {
	var results = [];
	var files = fs.readdirSync(dir, {withFileTypes: true});
	for(file of files) {
		if(file.isDirectory()) {
			results = results.concat(recursivelyReadDirectory(dir+"/"+file.name));
		} else {
			results.push(dir+"/"+file.name);
		}
	}

	return results;
}

//for handling commands
const registerCommand = function({command, module, name} = {}) {
	if(!command) return;
	command.module = module;
	command.name = name;
	module.commands.set(name, command);
	bot.commands.set(name, command);
	bot.aliases.set(name, name);
	if(command.alias) command.alias.forEach(a => bot.aliases.set(a, name));
	
	if(command.subcommands) {
		var subcommands = command.subcommands;
		command.subcommands = new Discord.Collection();
		Object.keys(subcommands).forEach(c => {
			var cmd = subcommands[c];
			cmd.name = `${command.name} ${c}`;
			cmd.parent = command;
			cmd.module = command.module;
			if(!command.sub_aliases) command.sub_aliases = new Discord.Collection();
			command.sub_aliases.set(c, c);
			if(cmd.alias) cmd.alias.forEach(a => command.sub_aliases.set(a, c));
			if(command.permissions && !cmd.permissions) cmd.permissions = command.permissions;
			if(command.guildOnly != undefined && cmd.guildOnly == undefined)
				cmd.guildOnly = command.guildOnly;
			command.subcommands.set(c, cmd);
		})
	}
	return command;
}

async function setup() {
	var files;
	bot.db = require('./stores/__db.js')(bot);

	files = fs.readdirSync("./events");
	files.forEach(f => bot.on(f.slice(0,-3), (...args) => require("./events/"+f)(...args,bot)));

	bot.utils = {};
	files = fs.readdirSync("./utils");
	files.forEach(f => Object.assign(bot.utils, require("./utils/"+f)));

	files = recursivelyReadDirectory("./commands");

	bot.modules = new Discord.Collection();
	bot.mod_aliases = new Discord.Collection();
	bot.commands = new Discord.Collection();
	bot.aliases = new Discord.Collection();
	for(f of files) {
		var path_frags = f.replace("./commands/","").split(/(?:\\|\/)/);
		var mod = path_frags.length > 1 ? path_frags[path_frags.length - 2] : "Unsorted";
		var file = path_frags[path_frags.length - 1];
		if(!bot.modules.get(mod.toLowerCase())) {
			var mod_info = require(file == "__mod.js" ? f : f.replace(file, "__mod.js"));
			bot.modules.set(mod.toLowerCase(), {...mod_info, name: mod, commands: new Discord.Collection()})
			bot.mod_aliases.set(mod.toLowerCase(), mod.toLowerCase());
			if(mod_info.alias) mod_info.alias.forEach(a => bot.mod_aliases.set(a, mod.toLowerCase()));
		}
		if(file == "__mod.js") continue;

		mod = bot.modules.get(mod.toLowerCase());
		if(!mod) {
			console.log("Whoopsies");
			continue;
		}
		
		registerCommand({command: require(f), module: mod, name: file.slice(0, -3).toLowerCase()})
	}
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

bot.on("ready",()=>{
	console.log("Ready");
	updateStatus();
})

setup();
bot.connect();