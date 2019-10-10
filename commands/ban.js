module.exports = {
	help: ()=> "[Hack]bans members.",
	usage: ()=> [" [userID] [userID] ...  (new line) <reason> - Bans member(s) with the given ID(s). NOTE: Reason goes on a new line",
				 " edit [banID] [new reason] - Edit the reason for a ban"],
	execute: async (bot, msg, args)=>{
		var nargs = args.join(" ").split('\n');
		var membs = nargs[0].split(/,*\s+/);
		var reason = nargs.slice(1, nargs.length).join('\n')
		var succ = [];
		async function banMembers (){
			return await Promise.all(membs.map(async (m) => {
				await bot.getRESTUser(m).then(async (u)=>{
					await msg.guild.getBans().then(b=>{
						if(b){
							if(b.find(x => x.user.id == m)){
								succ.push({id:m,pass:true,info:u});
							} else {
								bot.banGuildMember(msg.guild.id,m,0,reason || "Banned through command.");
								succ.push({id:m,pass:true,info:u})
							}
						} else {
							bot.banGuildMember(msg.guild.id,m,0,reason || "Banned through command.");
							succ.push({id:m,pass:true,info:u})
						}
					})
				}).catch(e=>{
					console.log(e);
					succ.push({id:m,pass:false,reason:"User does not exist."});
				})

				return new Promise((res,rej)=>{
					setTimeout(()=>{
						res({id:m});
					},100)
				})
			})
			)
		}
		banMembers().then(async ()=>{
			var conf = await bot.utils.getConfig(bot, msg.guild.id);
			var message;
			var channel;
			var code = bot.utils.genCode(bot.CHARS);
			if(!(succ.filter(m => m.pass).length > 0)) {
				message = {content:'**No users were banned.**', embed: {
					title: "Results",
					fields: [
					{
						name: "Not Banned", value: (succ.filter(m => !m.pass).length > 0 ? succ.filter(x => !x.pass).map(m => m.id + " - " + m.reason).join("\n") : "None")
					}
					]
				}};
			} else if(succ.filter(m => !m.pass).length > 0) {
				message = {content:'**Some users were not banned.**', embed: {
					title: "Results",
					fields: [
					{
						name: "Not Banned", value: (succ.filter(m => !m.pass).length > 0 ? succ.filter(x => !x.pass).map(m => m.id + " - " + m.reason).join("\n") : "None")
					}
					]
				}};
			} else {
				message = {embed: {
					title: "Members Banned",
					fields: [
					{
						name: "**__Last Known Usernames__**",
						value: (succ.filter(x=> x.pass).map(m => `${m.info.username}#${m.info.discriminator}`).join("\n")) || "Something is fucky"
					},
					{
						name: "**__User IDs__**",
						value: (succ.filter(x=> x.pass).map(m => m.id).join("\n")) || "Something is fucky"
					},
					{
						name: "**__Reason__**",
						value: reason || "(no reason given)"
					}
					],
					color: 9256253,
					footer: {
						text: code
					},
					timestamp: new Date()
				}}
			}
			if(conf && conf.banlog_channel && msg.guild.channels.find(ch => ch.id == conf.banlog_channel) && !message.content)
				var channel = msg.guild.channels.find(ch => ch.id == conf.banlog_channel);
			else channel = msg.channel;

			var message = await channel.createMessage(message);

			var scc = await bot.utils.addBanLog(bot, code, msg.guild.id, message.channel.id, message.id);
			if(scc) msg.channel.createMessage("Log added! ID: "+code);
			else msg.channel.createMessage("The members have been banned, but the log was not successfully indexed.");
		});
	},
	permissions: ["manageMessages"],
	subcommands: {}
}

module.exports.subcommands.edit = {
	help: ()=> "Edit a ban message",
	usage: ()=> [" [banID] [new message] - Edit the message on a ban"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a ban ID and a reason");
		var log = await bot.utils.getBanLog(bot, args[0].toLowerCase(), msg.guild.id);

		if(!log) return msg.channel.createMessage("Log not found");
		else if(log == "deleted") return msg.channel.createMessage("Log was deleted due to the message no longer existing");

		console.log(log);

		try {
			bot.editMessage(log.channel_id, log.message_id, {embed: {
				title: log.embed.title,
				fields: [log.embed.fields[0], log.embed.fields[1], {
					name: "**__Reason__**",
					value: args.slice(1).join(" ")
				}],
				timestamp: log.embed.timestamp,
				footer: log.embed.footer
			}})
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Something went wrong")
		}
		
		msg.channel.createMessage("Log edited!");
	}
}