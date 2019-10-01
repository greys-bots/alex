module.exports = {
	help: ()=> "[Hack]bans members.",
	usage: ()=> [" [userID] - Bans member with that ID."],
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
					timestamp: new Date()
				}}
			}
			if(conf && conf.banlog_channel && msg.guild.channels.find(ch => ch.id == conf.banlog_channel) && !message.content)
				var channel = msg.guild.channels.find(ch => ch.id == conf.banlog_channel);
			else channel = msg.channel;

			channel.createMessage(message)
		});
	},
	permissions: ["manageMessages"]
}