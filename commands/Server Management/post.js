module.exports = {
	help: ()=> "Posts server embed in a given channel",
	usage: ()=> [' [serverID] [channel] [channel] [channel] ... - Posts a server in the given channel(s). NOTE: The channels can be IDs, channel-names, or #mentions'],
	execute: async (bot, msg, args)=> {
		if(!args[1]) return "Please provide a server ID and channel to post to";
		var guild = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!guild) return 'Server not found!';

		var dat = guild.contact_id == undefined || guild.contact_id == "" ? "" : await bot.utils.verifyUsers(bot, guild.contact_id);
		var contacts = dat.info ? dat.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n") : "(no contact provided)";

		var failed = [];

		for(var i = 1; i < args.length; i++) {
			var chan = msg.guild.channels.find(ch => ch.id == args[i].replace(/[<#>]/g,"") || ch.name == args[i].toLowerCase());
					   
			if(!chan) {
				failed.push({name: args[i], value: "Channel not found"});
				continue;
			}

			try {
				var message = await chan.createMessage({embed: {
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
						text: `ID: ${guild.server_id} | This server ${guild.visibility ? "is" : "is not"} visible on the website`
					}
				}});
				await bot.stores.serverPosts.create(msg.guild.id, guild.server_id, chan.id, message.id);
			} catch(e) {
				console.log(e);
				failed.push({name: args[i], value: e.message || e});
				continue;
			}
		}

		if(failed[0]) {
			return {embed: {
				title: "Post Failures",
				fields: failed
			}};
		} else return "Posted!";
	},
	permissions: ["manageMessages"],
	guildOnly: true
}
