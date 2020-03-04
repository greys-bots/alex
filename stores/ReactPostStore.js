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
				this.handleReactions(...args, this)
			} catch(e) {
				console.log(e);
			}
		})
	}

	async create(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO reactposts (
					server_id,
					channel_id,
					message_id,
					roles,
					page
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, channel, message, data.roles || [], page || 0]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, message));
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
				data.rows[0].raw_roles = data.rows[0].roles;
				data.rows[0].roles = roles;
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
				data.rows[0].raw_roles = data.rows[0].roles;
				data.rows[0].roles = posts;
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
					data.rows[i].raw_roles = data.rows[i].roles;
					data.rows[i].roles = roles;
				}
					
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				if(data.roles) await this.db.query(`UPDATE reactposts SET roles = $1 WHERE server_id = $2, message_id = $3`,[data.roles, server, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			var post = await this.get(server, message, true);
			if(data.post && data.post.embed) {
				try {
					var message = await this.bot.getMessage(post.channel_id, post.message_id);

					await message.edit(post.channel_id, post.message_id, {embed: data.post.embed});
					await message.removeReactions();
					for(emoji of data.post.emoji) await message.addReaction(emoji);
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
			} else {
				try {
					await this.bot.deleteMessage(post.channel_id, post.message_id);
					await this.delete(server, message);
				} catch(e) {
					if(e.message) return rej(e.message);
					else return rej(e);
				}
			}
			
			res(post);
		})
	}
	
	async delete(server, message) {
		return new Promise(async (res, rej) => {
			try {
				var post = await this.get(server, message);
				if(!post) return rej("Post not found");
				await this.db.query(`DELETE FROM reactposts WHERE server_id = $1 AND message_id = $2`, [server, message]);
				super.delete(`${server}-${message}`);
				await this.bot.deleteMessage(post.channel_id, post.message_id);
			} catch(e) {
				console.log(e);
				if(e.message && !e.message.toLowerCase().contains("unknown message")) return rej(e.message);
				else if(!e.message) return rej(e);
			}

			res();
		})
	}

	async handleReactions(msg, emoji, user, store) {
		return new Promise(async (res, rej) => {
			var post = await store.get(msg.guild.id, msg.id);
			if(!post) return;
			var role = post.roles.find(r => [emoji.name, "a"+emoji.name].includes(r.emoji));
			if(!role) return;
			role = msg.guild.roles.find(r => r.id == role.role_id);
			if(!role) return;
			var member = msg.guild.members.find(m => m.id == user);
			if(!member) return;

			try {
				if(member.roles.includes(role.id)) msg.guild.removeMembeole(user, role.id);
				else msg.guild.addMembeole(user, role.id);
				store.bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name.replace(/^:/,""), user);
			} catch(e) {
				console.log(e);
				var ch = await store.bot.getDMChannel(user);
				if(!ch) rej(e.message); //can't deliver error? reject
				if(e.stack.includes("addGuildMemberRole") || e.stack.includes("removeGuildMemberRole")) ch.createMessage(`Couldn't manage role **${rl.name}** in ${msg.guild.name}. Please let a mod know that something went wrong`);
				else ch.createMessage(`Couldn't remove your reaction in ${msg.guild.name}. Please let a mod know something went wrong`);
				res(); //successfully delivered error, so we can just resolve
			}

			res();
		})
	}
}

module.exports = (bot, db) => new ReactPostStore(bot, db);