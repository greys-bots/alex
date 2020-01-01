module.exports = {
	help: ()=> "Posts server embed in a given channel",
	usage: ()=> [' [serverID] [channel] [channel] [channel] ... - Posts a server in the given channel(s). NOTE: The channels can be IDs, channel-names, or #mentions'],
	execute: async (bot, msg, args)=> {
		var guild = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(!guild) return msg.channel.createMessage('Server not found.');

		var dat = guild.contact_id == undefined || guild.contact_id == "" ? "" : await bot.utils.verifyUsers(bot, guild.contact_id.split(" "));
		var contacts = dat.info ? dat.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n") : "(no contact provided)";

		var failed = [];

		for(var i = 1; i < args.length; i++) {
			var chan = msg.guild.channels.find(ch => ch.id == args[i].replace(/[<#>]/g,"") || ch.name == args[i]);
					   
			if(!chan) {
				failed.push({name: args[i], value: "Channel not found"});
			}

			chan.createMessage({embed: {
				title: guild.name || "(unnamed)",
				description: guild.description || "(no description provided)",
				fields: [
					{name: "Contact", value: contacts},
					{name: "Link", value: guild.invite ? guild.invite : "(no link provided)"},
					{name: "Members", value: guild.guild ? guild.guild.memberCount : "(unavailable)"}
				],
				thumbnail: {
					url: guild.pic_url || ""
				},
				color: 3447003,
				footer: {
					text: `ID: ${guild.server_id}`
				}
			}}).then(message => {
				bot.db.query(`INSERT INTO posts (host_id, server_id, channel_id, message_id) VALUES (?,?,?,?)`,[
					msg.guild.id,
					guild.id,
					message.channel.id,
					message.id
				])
			}).catch(e => {
				console.log(e);
				failed.push({name: args[i], value: e.message});
			})
		}

		if(failed[0]) {
			msg.channel.createMessage({embed: {
				title: "Post Failures",
				fields: failed
			}})
		} else msg.channel.createMessage("Posted!");
	},
	permissions: ["manageMessages"],
	guildOnly: true
}
