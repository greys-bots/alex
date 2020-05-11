module.exports = {
	help: ()=> "Lists all posts in the database",
	usage: ()=> [" - Lists all posts the database has, for debug reasons"],
	execute: async (bot, msg, args) => {
		var servers = await bot.stores.servers.getAll(msg.guild.id);
		if(!servers || !servers[0]) return "No servers or posts registered!";
		if(!servers.find(s => s.posts && s.posts[0])) return "No posts registered!";
		var count = 0;
		servers.forEach(s => { if(s.posts) count += s.posts.length });

		msg.addReaction(process.env.HOURGLASS || "⌛");
		var embeds = [];
		for(var server of servers) {
			if(!server.posts) continue;
			var tmp = await bot.utils.genEmbeds(bot, server.posts, (dat) => {
				var channel = msg.guild.channels.find(c => c.id == dat.channel_id);
				return {
					name: `Channel: ${channel ? `${channel.name} (${channel.id})` : `${dat.channel_id} (channel not found)`}`,
					value: `Message ID: ${dat.message_id} ([go to](https://discordapp.com/channels/${msg.guild.id}/${dat.channel_id}/${dat.message_id}))`
				}
			}, {
				title: `Posts for server ${server.name} (${server.server_id})`,
			}, 10, {addition: ""});

			embeds = embeds.concat(tmp);
		}
		msg.removeReaction(process.env.HOURGLASS || "⌛");

		if(embeds[1]) {
			for(let i = 0; i < embeds.length; i++) {
				embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${count} posts total)`;
			}
		}

		return embeds;
	},
	alias: ['lp'],
	permissions: ["manageMessages"],
	guildOnly: true
}