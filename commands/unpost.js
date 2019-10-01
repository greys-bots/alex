module.exports = {
	help: ()=> "Removes posts of a server from a channel",
	usage: ()=> [" [id] [channel] - Removes server's posts from the given channel (NOTE: channel can be ID, name, or #mention"],
	execute: async (bot, msg, args)=> {
		var guild = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(!guild) return msg.channel.createMessage('Server not found');
		var chan = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[1] || ch.name == args[1]);
		if(!chan) return msg.channel.createMessage('Channel not found');

		var posts = await bot.utils.getPosts(bot, msg.guild.id, guild.id, chan.id);
		if(posts == false) return msg.channel.createMessage('Something went wrong');
		else if(!posts) return msg.channel.createMessage('Posts in that channel not found');

		await Promise.all(posts.map(async p => {
			await bot.deleteMessage(p.channel_id, p.message_id).then(async ()=> {
				await bot.utils.deletePost(bot, msg.guild.id, p.message_id).then(() => {
					return new Promise(res => setTimeout(()=> res(1), 100))
				})
			}).catch(e => {
				console.log(e);
				return new Promise(res => setTimeout(()=> res(1), 100))
			})
		})).then(()=> {
			msg.channel.createMessage('Unpost complete!')
		}).catch(e => {
			console.log(e);
			msg.channel.createMessage('Something went wrong')
		})
	},
	permissions: ["manageMessages"]
}