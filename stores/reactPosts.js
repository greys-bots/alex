const {Collection} = require("discord.js");

class ReactPostStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on("messageReactionAdd", (...args) => {
			try {
				this.handleReactions(...args)
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageDelete", async (msg) => {
			return new Promise(async (res, rej) => {
				if(msg.channel.type == 'dm') return;

				try {
					var post = await this.get(msg.channel.guild.id, msg.id);
					if(!post) return;
					await this.delete(post.server_id, post.message_id);
				} catch(e) {
					console.log(e);
					return rej(e.message || e);
				}
			})	
		})
	}

	async create(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO reactposts (
					server_id,
					channel_id,
					message_id,
					category,
					roles,
					page,
					single,
					required
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
				[server, channel, message, data.category, data.roles || [], data.page || 0, data.single, data.required]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, message));
		})
	}

	async index(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO reactposts (
					server_id,
					channel_id,
					message_id,
					category,
					roles,
					page,
					single,
					required
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
				[server, channel, message, data.category, data.roles || [], data.page || 0, data.single, data.required]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, message, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var post = super.get(`${server}-${message}`);
				if(post) return res(post);
			}

			try {
				var data = await this.db.query(`SELECT * FROM reactposts WHERE server_id = $1 AND message_id = $2`,[server, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				var roles = [];
				for(var role of data.rows[0].roles) {
					try {
						var rl = await this.bot.stores.reactRoles.getByRowID(server, role);
					} catch(e) {
						continue;
					}
					roles.push(rl);
				}

				var msg;
				try {
					var channel = await this.bot.channels.fetch(data.rows[0].channel_id);
					msg = await channel.messages.fetch(data.rows[0].message_id);
				} catch(e) {
					console.log(e);
					this.delete(server, message);
					return rej("post deleted or no longer accessible.");
				}

				data.rows[0].raw_roles = data.rows[0].roles;
				data.rows[0].roles = roles;
				data.rows[0].message = msg;
				this.set(`${server}-${message}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByRowID(server, id) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM reactposts WHERE server_id = $1 AND id = $2`,[server, id]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				for(var role of data.rows[0].roles) {
					try {
						var rl = await this.bot.stores.reactRoles.getByRowID(server, role);
					} catch(e) {
						continue;
					}
					roles.push(rl);
				}

				var msg;
				try {
					var channel = await this.bot.channels.fetch(data.rows[0].channel_id);
					msg = await channel.messages.fetch(data.rows[0].message_id);
				} catch(e) {
					console.log(e);
					this.delete(server, message);
					return rej("Post deleted or no longer accessible");
				}

				data.rows[0].raw_roles = data.rows[0].roles;
				data.rows[0].roles = posts;
				data.rows[0].message = msg;
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM reactposts WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					var roles = [];
					for(var role of data.rows[i].roles) {
						try {
							var rl = await this.bot.stores.reactRoles.getByRowID(server, role);
						} catch(e) {
							continue;
						}
						roles.push(rl);
					}

					var msg;
					try {
						var channel = await this.bot.channels.fetch(data.rows[i].channel_id);
						msg = await channel.messages.fetch(data.rows[i].message_id);
					} catch(e) {
						console.log(e);
						this.delete(server, data.rows[i].message_id);
						continue;
					}
					data.rows[i].raw_roles = data.rows[i].roles;
					data.rows[i].roles = roles;
					data.rows[i].message = msg;
				}
					
				res(data.rows)
			} else res(undefined);
		})
	}

	async getByRole(server, id) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM reactposts WHERE server_id = $1 AND $2 = ANY(reactposts.roles)`,[server, id]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					var roles = [];
					for(var role of data.rows[i].roles) {
						try {
							var rl = await this.bot.stores.reactRoles.getByRowID(server, role);
						} catch(e) {
							continue;
						}
						roles.push(rl);
					}

					var msg;
					try {
						var channel = await this.bot.channels.fetch(data.rows[i].channel_id);
						msg = await channel.messages.fetch(data.rows[i].message_id);
					} catch(e) {
						console.log(e);
						this.delete(server, data.rows[i].message_id);
						continue;
					}
					data.rows[i].raw_roles = data.rows[i].roles;
					data.rows[i].roles = roles;
					data.rows[i].message = msg;
				}
					
				res(data.rows)
			} else res(undefined);
		})
	}

	async getByRowIDs(server, ids) {
		return new Promise(async (res, rej) => {
			if(ids.length == 0) return res([]);
			try {
				var data = await this.db.query(`SELECT * FROM reactposts WHERE server_id = $1 AND id = ANY($2)`,[server, ids]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				if(data.roles || data.single || data.required)
					await this.db.query(`UPDATE reactposts SET roles = $1, single = $2, required = $3 WHERE server_id = $4 AND message_id = $5`,
						[data.roles, data.single, data.required, server, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			var post = await this.get(server, message, true);

			if(post.message?.embeds[0] && post.message.author.id == this.bot.user.id) { //react post from us
				if(!data.embed && data.roles) { //regen roles
					data = await this.bot.utils.genReactPosts(this.bot, post.roles, {
						title: post.message.embeds[0].title,
						description: post.message.embeds[0].description,
						footer: post.message.embeds[0].footer
					})
					data = data[0];
				}

				if(data.embed) {
					try {
						await post.message.edit({embed: data.embed});
						await post.message.reactions.removeAll()
						for(emoji of data.emoji) await post.message.react(emoji);
					} catch(e) {
						console.log(e);
						return rej(e.message);
					}
				} else if(!data.embed && post.page > 0) {
					try {
						await this.delete(server, message);
						await post.message.delete();
					} catch(e) {
						return rej(e.message || e);
					}
				}
			} else { //probably not a react post, or not from us; bound post instead
				var channel = await this.bot.channels.fetch(post.channel_id);
				var msg = await channel.messages.fetch(post.message_id);

				if(!data.emoji) data.emoji = post.roles.map(r => r.emoji);
				await msg.reactions.removeAll();
				for(var emoji of data.emoji) await msg.react(emoji);
			}
			
			res(post);
		})
	}

	//for react roles bound outside of categories
	async updateBound(server, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				if(data.roles) await this.db.query(`UPDATE reactposts SET roles = $1 WHERE server_id = $2, message_id = $3`,[data.roles, server, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			var post = await this.get(server, message, true);
			if(!post.roles || !post.roles[0]) await this.delete(server, message);
			
			res(post);
		})
	}
	
	async delete(server, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM reactposts WHERE server_id = $1 AND message_id = $2`, [server, message]);
				super.delete(`${server}-${message}`);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			res();
		})
	}

	async handleReactions(react, user) {
		return new Promise(async (res, rej) => {
			if(this.bot.user.id == user.id) return;
			if(react.partial) react = await react.fetch();
			var msg = await react.message.fetch();

			var post = await this.get(msg.channel.guild.id, msg.id);
			if(!post) return;
			if(react.emoji.id) react.emoji.name = `:${react.emoji.name}:${react.emoji.id}`;
			var role = post.roles.find(r => [react.emoji.name, `a${react.emoji.name}`].includes(r.emoji));
			if(!role) return;
			// var roles = post.roles.map(r => msg.channel.guild.roles.find(x => x.id == r.role_id)).filter(x => x && x.id != role.role_id);
			role = await msg.channel.guild.roles.fetch(role.role_id);
			if(!role) return;
			var member = await msg.channel.guild.members.fetch(user.id);
			if(!member) return;

			if(post.category) var category = await this.bot.stores.reactCategories.get(msg.channel.guild.id, post.category);

			try {
				react.users.remove(user.id);
				if(post.required && !member.roles.cache.has(post.required)) return;
				if(member.roles.cache.has(role.id)) await member.roles.remove(role.id);
				else await member.roles.add(role.id);
				if(category?.single) category.roles.forEach(r => { if(member.roles.cache.has(r.role_id) && r.role_id != role.id) member.roles.remove(r.role_id)})
			} catch(e) {
				console.log(e);
				return await user.send(`mrr! error:\n${e.message}\nlet a mod know something went wrong.`);
			}

			res();
		})
	}
}

module.exports = (bot, db) => new ReactPostStore(bot, db);