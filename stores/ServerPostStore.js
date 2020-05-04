const {Collection} = require("discord.js");

class ServerPostStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on("messageDelete", async (msg) => {
			return new Promise(async (res, rej) => {
				if(msg.channel.type == 1) return;

				try {
					var post = await this.get(msg.channel.guild.id, msg.id);
					if(!post) return;
					await this.delete(post.host_id, post.message_id);
				} catch(e) {
					console.log(e);
					return rej(e.message || e);
				}
			})	
		})

		this.bot.on("guildCreate", async (guild) => {
			return new Promise(async (res, rej) => {
				await this.updateByServer(guild.id);
			})	
		})

		this.bot.on("guildUpdate", async (guild) => {
			return new Promise(async (res, rej) => {
				await this.bot.stores.servers.updateByID(guild.id, {name: guild.name, pic_url: guild.iconURL})
				await this.updateByServer(guild.id, {name: guild.name, pic_url: guild.iconURL});
			})
		})

		this.bot.on("guildMemberAdd", async (guild, member) => {
			return new Promise(async (res, rej) => {
				//update member count
				await this.updateByServer(guild.id);
				
				//notify current guild if the user is banned from their synced server
				var scfg = await this.bot.stores.syncConfigs.get(guild.id);
				if(!scfg || (!scfg.sync_id && !scfg.confirmed) || !scfg.ban_notifs) return;
				var log = await this.bot.stores.banLogs.getByUser(scfg.sync_id, member.id);
				if(!log || log == "deleted") return;
				try {
					await bot.createMessage(scfg.ban_notifs, {embed: {
						title: "Ban Notification",
						description: [
							`New member **${member.username}#${member.discriminator}** (${member.id})`,
							` has been banned from your currently synced server.\n`,
							`Reason:\n`,
							log.embed.fields[2].value
						].join(""),
						color: parseInt("aa5555", 16)
					}})
				} catch(e) {
					console.log(e);
				}
			})
		})

		this.bot.on("guildMemberRemove", async (guild, member) => {
			return new Promise(async (res, rej) => {
				//update member count
				await this.updateByServer(guild.id);
			});
		})

		this.bot.on("messageReactionAdd", async (...args) => {
			await this.handleReactions(...args);
		})
	}

	async create(host, server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO posts (
					host_id,
					server_id,
					channel_id,
					message_id
				) VALUES ($1,$2,$3,$4)`,
				[host, server, channel, message]);
			} catch(e) {
				console.log(e);
			 	return rej(e.message);
			}
			
			res(await this.get(host, message));
		})
	}

	async index(host, server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO posts (
					host_id,
					server_id,
					channel_id,
					message_id
				) VALUES ($1,$2,$3,$4)`,
				[host, server, channel, message]);
			} catch(e) {
				console.log(e);
			 	return rej(e.message);
			}
			
			res();
		})
	}

	async get(host, message, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var post = super.get(`${host}-${message}`);
				if(post) return res(post);
			}

			try {
				var data = await this.db.query(`SELECT * FROM posts WHERE host_id = $1 AND message_id = $2`,[host, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				data.rows[0].server = await this.bot.stores.servers.getRaw(data.rows[0].host_id, data.rows[0].server_id);
				try {
					data.rows[0].message = await this.bot.getMessage(data.rows[0].channel_id, data.rows[0].message_id);
				} catch(e) {
					console.log(e);
					data.rows[0].message = undefined;
					await this.delete(data.rows[0].host_id, data.rows[0].message_id);
				}
				this.set(`${host}-${message}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(host) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM posts WHERE host_id = $1`,[host]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			var servers = {};

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					//small cache to avoid spamming requests per post
					if(servers[data.rows[i].server_id]) data.rows[i].server = servers[data.rows[i].server_id];
					else {
						data.rows[i].server = await this.bot.stores.servers.getRaw(host, data.rows[i].server_id);
						servers[data.rows[i].server_id] = data.rows[i].server;
					}
						
					try {
						data.rows[i].message = await this.bot.getMessage(data.rows[i].channel_id, data.rows[i].message_id);
					} catch(e) {
						console.log(e);
						data.rows[i].message = undefined;
						await this.delete(data.rows[i].host_id, data.rows[i].message_id);
					}
				}
					
				res(data.rows)
			} else res(undefined);
		})
	}

	async getByServer(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM posts WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					data.rows[i].server = await this.bot.stores.servers.getRaw(data.rows[i].host_id, data.rows[i].server_id);;
					try {
						data.rows[i].message = await this.bot.getMessage(data.rows[i].channel_id, data.rows[i].message_id);
					} catch(e) {
						console.log(e);
						data.rows[i].message = undefined;
						await this.delete(data.rows[i].host_id, data.rows[i].message_id);
					}
				}
					
				res(data.rows)
			} else res(undefined);
		})
	}

	async getByHostedServer(host, server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM posts WHERE host_id = $1 AND server_id = $2`,[host, server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					data.rows[i].server = await this.bot.stores.servers.getRaw(host, server);
					try {
						data.rows[i].message = await this.bot.getMessage(data.rows[i].channel_id, data.rows[i].message_id);
					} catch(e) {
						console.log(e);
						data.rows[i].message = undefined;
						await this.delete(data.rows[i].host_id, data.rows[i].message_id);
					}
				}
					
				res(data.rows)
			} else res(undefined);
		})
	}

	async getInChannel(host, server, channel) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM posts WHERE host_id = $1 AND server_id = $2 AND channel_id = $3`,[host, server, channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					data.rows[i].server = await this.bot.stores.servers.getRaw(host, server);;
					try {
						data.rows[i].message = await this.bot.getMessage(data.rows[i].channel_id, data.rows[i].message_id);
					} catch(e) {
						console.log(e);
						data.rows[i].message = undefined;
						await this.delete(data.rows[i].host_id, data.rows[i].message_id);
					}
				}
					
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(host, message, data = {/* server data */}) {
		return new Promise(async (res, rej) => {
			//no database updates needed! yay!
			try {
				var post = await this.get(host, message);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(!post || !post.message) {
				await this.delete(host, message);
				return rej("Message for post was deleted");
			}

			//work out any missing parts
			data = {
				title: data.name || post.message.embeds[0].title,
				description: data.description || post.message.embeds[0].description,
				invite: data.invite || post.message.embeds[0].fields[1].value,
				pic_url: data.pic_url || (post.message.embeds[0].thumbnail ? post.message.embeds[0].thumbnail.url : null),
				color: data.color ? parseInt(data.color, 16) : post.message.embeds[0].color,
				contact_id: data.contact_id,
				visibility: data.visibility,
				footer: {text: `ID: ${data.server_id} | This server ${data.visibility ? "is" : "is not"} visible on the website`}
			};

			if(data.contact_id) {
				data.contacts = await this.bot.utils.verifyUsers(this.bot, data.contact_id);
				if(!data.contacts.pass[0]) return rej("Contacts invalid");
				data.contacts = data.contacts.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n");
			} else data.contacts = "(no contacts provided)";

			try {
				await this.bot.editMessage(post.channel_id, post.message_id, {embed: {
					title: data.title || "(unnamed)",
					description: data.description || "(no description provided)",
					fields: [
						{name: "Contact", value: data.contacts},
						{name: "Link", value: data.invite},
						{name: "Members", value: post.server && post.server.guild ? post.server.guild.memberCount : "(unavailable)"}
					],
					thumbnail: {
						url: data.pic_url || ""
					},
					color: data.color || 3447003,
					footer: {
						text: `ID: ${post.server.server_id} | This server ${data.visibility ? "is" : "is not"} visible on the website`
					}
				}})
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			res();
		})
	}

	async updateMass(host, messages, data = {/* server data */}) {
		return new Promise(async (res, rej) => {
			for(var message of messages) {
				try {
					await this.update(host, message, data);
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
			}
			res();
		})
	}

	async updateByServer(server, data = {/* server data */}) {
		return new Promise(async (res, rej) => {
			var posts = await this.getByServer(server);
			if(!posts) return res();
			try {
				for(var post of posts) await this.update(post.host_id, post.message_id, data);
			} catch(e) {
				return rej(e);
			}
			
			res();
		})
	}

	async updateByHostedServer(host, server, data = {/* server data */}) {
		return new Promise(async (res, rej) => {
			var posts = await this.getByHostedServer(host, server);
			if(!posts) return res();
			try {
				await this.updateMass(host, posts.map(p => p.message_id), data);
			} catch(e) {
				return rej(e);
			}
			
			res();
		})
	}

	async delete(host, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM posts WHERE host_id = $1 AND message_id = $2`, [host, message]);
				super.delete(`${host}-${message}`);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}
			
			res();
		})
	}

	async deleteByHostedServer(host, server) {
		return new Promise(async (res, rej) => {
			var posts = await this.getByHostedServer(host, server);
			if(!posts) return res();
			try {
				await this.db.query(`DELETE FROM posts WHERE host_id = $1 AND message_id = ANY($2)`, [host, posts.map(p => p.message_id)]);
				for(var post of posts) {
					if(post.message) post.message.delete();
					super.delete(`${host}-${post.message_id}`);
				}
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}
			
			res();
		})
	}

	async handleReactions(message, emoji, user) {
		return new Promise(async (res, rej) => {
			if(this.bot.user.id == user) return res();
			if(!["📝", "✏️"].includes(emoji.name)) return res();
			try {
				message = await this.bot.getMessage(message.channel.id, message.id);
				var member = await this.bot.users.find(m => m.id == user);
				if(!member) return rej("Couldn't get user");
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}

			if(!message.guild) return res();

			var post = await this.get(message.guild.id, message.id);
			if(!post) return res();
			await this.bot.removeMessageReaction(message.channel.id, message.id, emoji.name, user);

			var channel = await this.bot.getDMChannel(user);
			if(!post.server.contact_id || !post.server.contact_id.includes(user)) {
				try {
					await channel.createMessage("You aren't a contact for that server, and thus cannot edit it");
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
				
				return res();
			}

			var config = await this.bot.stores.configs.get(message.guild.id);
			if(!config || !config.edit_channel || !message.guild.channels.find(c => c.id == config.edit_channel))
				return await channel.createMessage("That guild isn't currently accepting edit requests");

			var out = await this.bot.stores.editRequests.search(message.guild.id, {server_id: post.server.server_id});
			if(out) {
				await channel.createMessage("There is already an outgoing edit request for that server!");
				return res();
			}

			var data = {
				name: post.server.name || post.message.embeds[0].title,
				description: post.server.description || post.message.embeds[0].description,
				invite: post.server.invite || post.message.embeds[0].fields[1].value,
				pic_url: post.server.pic_url || (post.message.embeds[0].thumbnail ? post.message.embeds[0].thumbnail.url : null),
				color: post.server.color,
				contact_id: post.server.contact_id,
				visibility: post.server.visibility
			};

			if(post.server.contact_id) {
				data.contacts = await this.bot.utils.verifyUsers(this.bot, post.server.contact_id);
				if(!data.contacts.pass[0]) return rej("Contacts invalid");
				data.contacts = data.contacts.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n");
			} else data.contacts = "(no contacts provided)";

			var done = false;
			var loops = 3;
			var response;
			while(!done && loops > 0) {
				await channel.createMessage({
					content: [
						"What would you like to edit?\n",
						"```yaml\n",
						"1 - Server name\n",
						"2 - Server description\n",
						"3 - Server invite\n",
						"4 - Server icon\n",
						"5 - Server color\n",
						"6 - Server visibility\n",
						"```\n",
						"Below is a preview of your server.",
						" Note that completing this process won't immediately update anything;",
						" all desired edits will be sent as a request to the mods, and they can be denied\n",
						"Also note that you may only edit up to three values at once"
					].join(""),
					embed: {
						title: data.name || "(unnamed)",
						description: data.description || "(no description provided)",
						fields: [
							{name: "Contact", value: data.contacts},
							{name: "Link", value: data.invite},
							{name: "Members", value: post.server.guild ? post.server.guild.memberCount : "(unavailable)"}
						],
						thumbnail: {
							url: data.pic_url || ""
						},
						color: parseInt(data.color || '3498DB', 16),
						footer: {
							text: `ID: ${post.server.server_id} | This server ${data.visibility ? "is" : "is not"} visible on the website`
						}
					}
				});

				try {
					response = (await channel.awaitMessages(m => m.author.id == user, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
					switch(response) {
						case "1":
							await channel.createMessage("Enter the new name. You have 2 minutes to do this");
							response = (await channel.awaitMessages(m => m.author.id == user, {time:1000*60*5, maxMatches: 1, }))[0].content;
							data.name = response;
							break;
						case "2":
							await channel.createMessage("Enter the new description. You have 5 minutes to do this");
							response = (await channel.awaitMessages(m => m.author.id == user, {time:1000*60*5, maxMatches: 1, }))[0].content;
							data.description = response;
							break;
						case "3":
							await channel.createMessage("Enter the new invite. You have 2 minutes to do this");
							response = (await channel.awaitMessages(m => m.author.id == user, {time:1000*60*2, maxMatches: 1, }))[0].content;
							data.invite = response;
							break;
						case "4":
							await channel.createMessage("Enter or attach the new icon. You have 3 minutes to do this");
							response = (await channel.awaitMessages(m => m.author.id == user, {time:1000*60*3, maxMatches: 1, }))[0];
							if(response.attachments && response.attachments[0]) data.pic_url = response.attachments[0].url;
							else data.pic_url = response.content;
							break;
						case "5":
							await channel.createMessage("Enter the new color. You have 2 minutes to do this");
							response = (await channel.awaitMessages(m => m.author.id == user, {time:1000*60*2, maxMatches: 1, }))[0].content;
							var color = this.bot.tc(response.split(" ").join(""));
							if(!color.isValid()) {
								await channel.createMessage("That color is invalid! Aborting...");
								return res();
							}
							data.color = color.toHex();
							break;
						case "6":
							await channel.createMessage("Enter the new value (true/false). You have 2 minutes to do this");
							response = (await channel.awaitMessages(m => m.author.id == user, {time:1000*60*2, maxMatches: 1, }))[0].content;
							if(response == "true") data.visibility = true;
							else data.visibility = false;
							break;
						default:
							await channel.createMessage("Invalid input! Aborting...");
							return res();
							break;
					}
				} catch(e) {
					console.log(e);
					await channel.createMessage("ERR: "+e.message);
					return rej(e.message);
				}

				loops--;
				if(loops <= 0) break;

				await channel.createMessage("Would you like to edit something else? (y/n)");
				response = (await channel.awaitMessages(m => m.author.id == user, {time:1000*60*3, maxMatches: 1, }))[0].content.toLowerCase();
				if(!["y", "yes"].includes(response)) {
					done = true;
					break;
				};
			}

			await channel.createMessage({content: "Is this okay? (y/n)", embed: {
				title: data.name || "(unnamed)",
				description: data.description || "(no description provided)",
				fields: [
					{name: "Contact", value: data.contacts},
					{name: "Link", value: data.invite},
					{name: "Members", value: post.server.guild ? post.server.guild.memberCount : "(unavailable)"}
				],
				thumbnail: {
					url: data.pic_url || ""
				},
				color: parseInt(data.color || '3498DB', 16),
				footer: {
					text: `ID: ${post.server.server_id} | This server ${data.visibility ? "is" : "is not"} visible on the website`
				}
			}});

			response = (await channel.awaitMessages(m => m.author.id == user, {time:1000*60*3, maxMatches: 1, }))[0].content.toLowerCase();
			if(!["y", "yes"].includes(response)) return await channel.createMessage("Action cancelled");

			try {
				var echannel = message.guild.channels.find(c => c.id == config.edit_channel);
				var msg = await echannel.createMessage({content: "New edit request!", embed: {
					title: data.name || "(unnamed)",
					description: data.description || "(no description provided)",
					fields: [
						{name: "Contact", value: data.contacts},
						{name: "Link", value: data.invite},
						{name: "Members", value: post.server.guild ? post.server.guild.memberCount : "(unavailable)"}
					],
					thumbnail: {
						url: data.pic_url || ""
					},
					color: parseInt(data.color || '3498DB', 16),
					footer: {
						text: `ID: ${post.server.server_id} | This server ${data.visibility ? "is" : "is not"} visible on the website`
					},
					author: {
						name: `Requested by: ${member.username}#${member.discriminator}`,
						icon_url: member.avatarURL
					},
					timestamp: new Date().toISOString()
				}});
				["✅", "❌"].forEach(r => msg.addReaction(r));
				delete data.contacts;
				await this.bot.stores.editRequests.create(message.guild.id, echannel.id, msg.id, post.server.server_id, user, data);
				await channel.createMessage("Your edit request has been sent. You'll receive a notification once it has been accepted");
			} catch(e) {
				console.log(e);
				await channel.createMessage("ERR: "+ (e.message || e));
				rej(e.message || e);
			}
		})
	}
}

module.exports = (bot, db) => new ServerPostStore(bot, db);