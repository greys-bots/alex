module.exports = {
	help: ()=> "Removes posts of a server from a channel",
	usage: ()=> [" [id] [channel] - Removes server's posts from the given channel (NOTE: channel can be ID, name, or #mention"],
	execute: async (bot, msg, args)=> {
		var guild = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!guild) return 'Server not found!';
		var chan = msg.guild.channels.find(ch => ch.id == args[1].replace(/[<#>]/g,"") || ch.name == args[1].toLowerCase());
		if(!chan) return 'Channel not found!';

		try {
			var posts = await bot.stores.serverPosts.getInChannel(msg.guild.id, guild.id, chan.id);
		} catch(e) {
			return "ERR: "+e;
		}
		
		if(!posts || !posts[0]) return 'No posts found in that channel';

		var failed = [];
		for(var p of posts) {
			try {
				await bot.stores.serverPosts.delete(msg.guild.id, p.message_id)
				await bot.deleteMessage(p.channel_id, p.message_id)
			} catch(e) {
				console.log(e);
				failed.push({
					name: `[${p.channel_id}/${p.message_id}](https://discordapp.com/channels/${msg.guild.id}/${p.channel_id}/${p.message_id})`,
					value: e.message
				})
			}	
		}

		if(failed[0]) {
			return {embed: {
				title: "Failed",
				description: "Some posts couldn't be deleted",
				fields: failed
			}}
		} else return "Unpost complete!";
	},
	permissions: ["manageMessages"],
	guildOnly: true
}