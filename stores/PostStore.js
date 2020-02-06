const {Collection} = require("discord.js");

class PostStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(host, server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			this.db.query(`INSERT INTO posts (
				host_id,
				server_id,
				channel_id,
				message_id
			) VALUES (?,?,?,?)`,
			[host, server, channel, message], async (err, rows) => {
			 	if(err) {
			 		console.log(err);
			 		rej(err.message);
			 	} else {
			 		res(await this.get(host, message));
			 	}
			 })
		})
	}

	async get(host, message, forceUpdate = false) {
		return new Promise((res, rej) => {
			if(!forceUpdate) {
				var post = super.get(`${host}-${message}`);
				if(post) return res(post);
			}
			
			this.db.query(`SELECT * FROM posts WHERE host_id = ? AND message_id = ?`,[host, message], {
				id: Number,
				host_id: String,
		        server_id: String,
		        channel_id: String,
		        message_id: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						rows[0].server = await this.bot.stores.servers.getByRowID(rows[0].server_id);
						try {
							rows[0].message = await this.bot.getMessage(rows[0].channel_id, rows[0].message_id);
						} catch(e) {
							console.log(e);
							rows[0].message = undefined;
							await this.delete(rows[0].host_id, rows[0].message_id);
						}
						this.set(`${host}-${message}`, rows[0])
						res(rows[0])
					} else res(undefined);
				}
			})
		})
	}

	async getAll(host) {
		return new Promise((res, rej) => {		
			this.db.query(`SELECT * FROM posts WHERE host_id = ?`,[host], {
				id: Number,
				host_id: String,
		        server_id: String,
		        channel_id: String,
		        message_id: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						for(var i = 0; i < rows.length; i++) {
							rows[i].server = await this.bot.stores.servers.getByRowID(rows[i].server_id);
							try {
								rows[i].message = await this.bot.getMessage(rows[i].channel_id, rows[i].message_id);
							} catch(e) {
								console.log(e);
								rows[i].message = undefined;
								await this.delete(rows[i].host_id, rows[i].message_id);
							}
						}
						res(rows);
					} else res(undefined);
				}
			})
		})
	}

	async getByServer(server) {
		var srv = await this.bot.stores.servers.getByID(server);
		if(!srv) return Promise.resolve(undefined);
		return new Promise((res, rej) => {		
			this.db.query(`SELECT * FROM posts WHERE server_id = ?`,[srv.id], {
				id: Number,
				host_id: String,
		        server_id: String,
		        channel_id: String,
		        message_id: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						for(var i = 0; i < rows.length; i++) {
							rows[i].server = srv;
							try {
								rows[i].message = await this.bot.getMessage(rows[i].channel_id, rows[i].message_id);
							} catch(e) {
								console.log(e);
								rows[i].message = undefined;
								await this.delete(rows[i].host_id, rows[i].message_id);
							}
						}
						res(rows);
					} else res(undefined);
				}
			})
		})
	}

	async update(host, message, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE configs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE host_id = ? AND message_id = ?`,[...Object.values(data), host, message], async (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					var post = await this.get(host, message, true);
					if(!post.message) return rej("Post deleted");

					//edit post here
				}
			})
		})
	}

	async delete(host, message) {
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM posts WHERE host_id = ? AND message_id = ?`, [host, nessage], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					super.delete(`${host}-${message}`);
					res();
				}
			})
		})
	}
}

module.exports = (bot, db) => new PostStore(bot, db);