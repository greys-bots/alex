const {Collection} = require("discord.js");

class PostStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

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
				data.rows[0].server = await this.bot.stores.servers.getByRowID(data.rows[0].server_id);
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

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					data.rows[i].server = await this.bot.stores.servers.getByRowID(data.rows[i].server_id);
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
		var srv = await this.bot.stores.servers.getByID(server);
		if(!srv) return Promise.resolve(undefined);
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM posts WHERE server_id = $1`,[srv.id]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					data.rows[i].server = await this.bot.stores.servers.getByRowID(data.rows[i].server_id);
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
			
			if(!post.message) {
				await this.delete(host, message);
				return rej("Message for post was deleted");
			}

			var contacts;
			if(data.contact_id){
				contacts = await this.bot.utils.verifyUsers(this.bot, data.contact_id);
				if(!contacts.pass[0]) return rej("Contacts invalid");
				contacts = contacts.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n");
			} else contacts = "(no contacts provided)";

			try {
				await this.bot.editMessage(post.channel_id, post.message_id, {embed: {
					title: data.name || "(unnamed)",
					description: data.description || "(no description provided)",
					fields: [
						{name: "Contact", value: contacts},
						{name: "Link", value: data.invite ? data.invite : "(no link provided)", inline: true},
						{name: "Members", value: this.bot.guilds.find(g => g.id == data.server_id) ? this.bot.guilds.find(g => g.id == server.server_id).memberCount : "(unavailable)"}
					],
					thumbnail: {
						url: data.pic_url || ""
					},
					color: data.color ? parseInt(data.color, 16) : 3447003,
					footer: {
						text: `ID: ${data.server_id}`
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
			for(message of messages) {
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

	async delete(host, message) {
		return new Promise(async (res, rej) => {
			try {
				var post = await this.get(host, message);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			if(!post) return rej("Post not found");

			try {
				await this.db.query(`DELETE FROM posts WHERE host_id = $1 AND message_id = $2`, [host, message]);
				super.delete(`${host}-${message}`);
				await this.bot.deleteMessage(post.channel_id, post.message_id);
			} catch(e) {
				console.log(e);
				if(e.message && !e.message.toLowerCase().contains("unknown message")) return rej(e.message);
				else if(!e.message) return rej(e.message);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new PostStore(bot, db);