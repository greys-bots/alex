module.exports = {
	help: ()=> "Lists all posts in the database",
	usage: ()=> [" - Lists all posts the database has, for debug reasons"],
	execute: async (bot, msg, args) => {
		var posts = await bot.utils.getAllPosts(bot, msg.guild.id);
		var servers = await bot.utils.getServers(bot, msg.guild.id);
		if(!posts) return msg.channel.createMessage("No posts registered for this server");

		msg.addReaction(process.env.HOURGLASS || "⌛")
		if(servers && servers[0]) {
			var unmapped = [];
			for(var i = 0; i < posts.length; i++) {
				var s = servers.findIndex(s => posts[i].name ? s.server_id == posts[i].server_id : s.id == posts[i].server_id)
				if(s > -1) {
					if(!servers[s].posts) servers[s].posts = [];
					servers[s].posts.push({name: `Channel: ${posts[i].channel_id}`, value: `Message: ${posts[i].message_id}`});
				} else unmapped.push({name: `Channel: ${posts[i].channel_id}`, value: `Message: ${posts[i].message_id}`});
			}

			var embeds = servers.map((sv, i) => {
				return {embed: {
					title: `Posts for ${sv.name} (page ${i+1}/${servers.length+1})`,
					fields: sv.posts && sv.posts[0] ? sv.posts : [{name: "None", value: "*No posts registered for this server*"}],
					color: 3447003,
					footer: {
						text: `ID: ${servers[i].server_id}`
					}
				}}
			})
			embeds.push({embed: {
				title: `Unmapped Posts (page ${servers.length+1}/${servers.length+1})`,
				description: "Posts that don't belong to an indexed server",
				fields: unmapped[0] ? unmapped : [{name: "None", value: "*No unmapped posts registered*"}],
				color: 3447003
			}})

			var message = await msg.channel.createMessage(embeds[0])
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: embeds,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					try {
						message.removeReactions();
					} catch(e) {
						console.log(e);
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
		} else {
			if(posts.length > 10) {
				var embeds = await bot.utils.genEmbeds(bot, posts, (dat, bot) => {
					return {name: dat.name ? `${dat.name} (${dat.server_id})` : dat.server_id, value: `Channel ID: ${dat.channel_id}\nMessage ID: ${dat.message_id}`}
				}, {
					title: "Posts",
					description: "Currently indexed posts\nNOTE: server_id references id in servers table, not actual server ID"
				});

				var message = await msg.channel.createMessage(embeds[0])
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					index: 0,
					data: embeds,
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
						}
						delete bot.menus[message.id];
					}, 900000),
					execute: bot.utils.paginateEmbeds
				};
				["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
			} else {
				msg.channel.createMessage({ embed: {
					title: "Posts",
					description: "Currently indexed posts\nNOTE: server_id references id in servers table, not actual server ID",
					fields: posts.map(s => {
						return {name: s.name ? `${s.name} (${s.server_id})` : s.server_id, value: `Channel ID: ${s.channel_id}\nMessage ID: ${s.message_id}`}
					})
				}})
			}
		}
		msg.removeReaction(process.env.HOURGLASS || "⌛")
	},
	alias: ['lp'],
	permissions: ["manageMessages"],
	guildOnly: true
}