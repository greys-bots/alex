module.exports = {
	help: ()=> "Unbans members.",
	usage: ()=> [" [userID] [userID] [userID] ... <(newline) [reason]>- Unbans member(s) with the ID(s), with an optional reason."],
	execute: async (bot, msg, args)=>{
		var nargs = args.join(" ").split('\n');
		var membs = nargs[0].split(/,*\s+/);
		var reason = nargs.slice(1, nargs.length).join('\n')
		var succ = [];
		var b = await msg.guild.getBans();
		for(var i = 0; i < membs.length; i++) {
			var u;
			try {
				u = await bot.getRESTUser(membs[i])
			} catch(e) {
				console.log(e);
				succ.push({id:membs[i],pass:false,reason:"User does not exist."});
			}
			if(b){
				if(b.find(x => x.user.id == membs[i])){
					bot.unbanGuildMember(msg.guild.id,membs[i],reason || "Unbanned through command.");
					await bot.utils.scrubBanLogs(bot, msg.guild.id, membs[i])
					succ.push({id:membs[i],pass:true,info:u});
				} else {
					succ.push({id:membs[i],pass:true,info:u});
				}
			} else {
				succ.push({id:membs[i],pass:true,info:u})
			}
		}
		
		var conf = await bot.utils.getConfig(bot, msg.guild.id);
		var message;
		var channel;
		if(!(succ.filter(m => m.pass).length > 0)) {
			message = {content:'**No users were unbanned.**', embed: {
				title: "Results",
				fields: [
				{
					name: "Not unbanned", value: (succ.filter(m => !m.pass).length > 0 ? succ.filter(x => !x.pass).map(m => m.id + " - " + m.reason).join("\n") : "None")
				}
				]
			}};
		} else if(succ.filter(m => !m.pass).length > 0) {
			message = {content:'**Some users were not unbanned.**', embed: {
				title: "Results",
				fields: [
				{
					name: "Not unbanned", value: (succ.filter(m => !m.pass).length > 0 ? succ.filter(x => !x.pass).map(m => m.id + " - " + m.reason).join("\n") : "None")
				}
				]
			}};
		} else {
			message = {embed: {
				title: "Unbanned Members",
				fields: [
				{
					name: "**__Last Known Usernames__**",
					value: (succ.filter(x=> x.pass).map(m => `${m.info.username}#${m.info.discriminator}`).join("\n")) || "(name could not be received)"
				},
				{
					name: "**__User IDs__**",
					value: (succ.filter(x=> x.pass).map(m => m.id).join("\n")) || "(ID could not be received)"
				},
				{
					name: "**__Reason__**",
					value: reason || "(no reason given)"
				}
				],
				color: parseInt("55aa55", 16),
				timestamp: new Date(),
				thumbnail: {
					url: "https://cdn.discordapp.com/attachments/577309619316195338/619375530076143627/HubOK.png"
				}
			}}
		}
		if(conf && conf.banlog_channel && msg.guild.channels.find(ch => ch.id == conf.banlog_channel) && !message.content)
			var channel = msg.guild.channels.find(ch => ch.id == conf.banlog_channel);
		else channel = msg.channel;

		channel.createMessage(message);
		var unbanned = succ.filter(m => m.pass).map(u => u.id);

		var synced = await bot.utils.getSyncedServers(bot, msg.guild.id);
		if(!synced || !synced[0]) return;
		for(var i = 0; i < synced.length; i++) {
			if(!synced[i].ban_notifs) continue;
			var bans;
			try {
				bans = await synced[i].guild.getBans();
			} catch(e) {
				console.log(e);
				continue;
			}
			if(!bans) continue;
			if(bans.map(bn => bn.user).find(m => unbanned.includes(m.id))) {
				var tub = bans.map(b => b.user).filter(m => unbanned.includes(m.id));
				try {
					await bot.createMessage(synced[i].ban_notifs, {embed: {
						title: "Unban Notification",
						description: [`These users are banned in your server and have been **unbanned** from ${msg.guild.name}.\n`,
									  `This was the given reason:\n`,
									  reason || "(no reason given)"].join(""),
						fields: tub.map(m => {
							return {name: `${m.username}#${m.discriminator}`, value: m.id}
						}),
						color: parseInt("55aa55", 16)
					}})
				} catch(e) {
					console.log(e);
					//guess we'll die
				}
			}
		}
	},
	permissions: ["manageMessages"],
	guildOnly: true
}