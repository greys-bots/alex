module.exports = {
	starMessage: async function(bot, msg, channel, data) {
		var attach = [];
		if(msg.attachments[0]) {
			for(var i = 0; i < msg.attachments.length; i++) {
				var att = await bot.fetch(msg.attachments[i].url);
				att = Buffer.from(await att.buffer());
				if(att.length > 8000000) continue;
				attach.push({file: att, name: msg.attachments[i].filename});
			}
		}
		var embed = {
			author: {
				name: `${msg.author.username}#${msg.author.discriminator}`,
				icon_url: msg.author.avatarURL
			},
			footer: {
				text: msg.channel.name
			},
			description: (msg.content || "*(image only)*") + `\n\n[Go to message](https://discordapp.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`,
			timestamp: new Date(msg.timestamp)
		}
		bot.createMessage(channel, {content: `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`,embed: embed}, attach ? attach : null).then(message => {
			bot.db.query(`INSERT INTO starboard (server_id, channel_id, message_id, original_id, emoji) VALUES (?,?,?,?,?)`,[
				message.guild.id,
				message.channel.id,
				message.id,
				msg.id,
				data.emoji
			])
		});
	},
	updateStarPost: async (bot, server, msg, data) => {
		return new Promise((res) => {
			bot.db.query(`SELECT * FROM starboard WHERE original_id=? AND server_id=? AND emoji=?`,[msg, server, data.emoji], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					var post = rows[0];
					if(!post) return res(true);
					try {
						if(data.count > 0) bot.editMessage(post.channel_id, post.message_id, `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`);
						else bot.deleteMessage(post.channel_id, post.message_id);
					} catch(e) {
						console.log(e);
						return res(false);
					}
					res(true);
					
				}
			})
		})
	},
	getStarPosts: async (bot, server) => {
		return new Promise((res) => {
			bot.db.query(`SELECT * FROM starboard WHERE server_id=?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					res(rows);
				}
			})
		})
	},
	getStarPost: async (bot, server, msg, emoji) => {
		return new Promise((res) => {
			bot.db.query(`SELECT * FROM starboard WHERE server_id=? AND original_id=? AND emoji=?`,[server, msg, emoji], (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					res(rows[0]);
				}
			})
		})
	},
	deleteStarPosts: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM starboard WHERE server_id = ?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	}
}