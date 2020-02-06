const {Collection} = require("discord.js");

class ServerStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(host, server, data = {}) {
		return new Promise(async (res, rej) => {
			this.db.query(`INSERT INTO servers (
				host_id,
				server_id,
				name,
				invite,
				pic_url
			) VALUES (?,?,?,?,?)`,
			[host, server, data.name || "", data.invite || "", data.pic_url || ""], async (err, rows) => {
			 	if(err) {
			 		console.log(err);
			 		rej(err.message);
			 	} else {
			 		res(await this.get(host, server));
			 	}
			 })
		})
	}

	async get(host, server, forceUpdate = false) {
		return new Promise((res, rej) => {
			if(!forceUpdate) {
				var srv = super.get(`${host}-${server}`);
				if(srv) return res(srv);
			}
			
			this.db.query(`SELECT * FROM servers WHERE host_id = ? AND server_id = ?`,[host, server], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				color: String,
				visibility: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						rows[0].guild = bot.guilds.find(g => g.id == rows[0].server_id);
						this.set(`${host}-${server}`, rows[0])
						res(rows[0])
					} else res(undefined);
				}
			})
		})
	}

	async getByID(server) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM servers WHERE server_id = ?`,[server], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				color: String,
				visibility: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						rows[0].guild = bot.guilds.find(g => g.id == rows[0].server_id);
						res(rows[0])
					} else res(undefined);
				}
			})
		})
	}

	async getByRowID(id) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM servers WHERE id = ?`,[id], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				color: String,
				visibility: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						rows[0].guild = bot.guilds.find(g => g.id == rows[0].server_id);
						res(rows[0])
					} else res(undefined);
				}
			})
		})
	}

	async getAll(host) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM servers WHERE host_id = ?`,[host], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				color: String,
				visibility: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						for(var i = 0; i < rows.length; i++) {
							rows[i] = bot.guilds.find(g => g.id == rows[i].server_id);
						}
						res(rows)
					} else res(undefined);
				}
			})
		})
	}

	async getAllWithContact(host, user) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM servers WHERE host_id = ? AND contact_id LIKE ?`,[host, "%"+user+"%"], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				color: String,
				visibility: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						for(var i = 0; i < rows.length; i++) {
							rows[i] = bot.guilds.find(g => g.id == rows[i].server_id);
						}
						res(rows)
					} else res(undefined);
				}
			})
		})
	}

	async find(host, query) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM servers WHERE host_id = ? AND (name LIKE ? OR id = ?)`, [host, "%"+query+"%", query] {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				color: String,
				visibility: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						rows[0].guild = bot.guilds.find(g => g.id == rows[0].server_id);
						res(rows[0])
					} else res(undefined);
				}
			})
		})
	}

	async update(host, server, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE servers SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE host_id = ? AND server_id = ?`,[...Object.values(data), host, server], async (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					res(await this.get(`${host}-${server}`, true));
				}
			})
		})
	}

	async updateByID(server, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE servers SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id = ?`,[...Object.values(data), server], async (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					res(await this.get(server));
				}
			})
		})
	}

	async delete(host, server) {
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM servers WHERE host_id = ? AND server_id = ?`, [host, server], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					super.delete(`${host}-${server}`);
					res();
				}
			})
		})
	}

	async deleteAll(host) {
		var servers = await this.getAll(host);
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM servers WHERE host_id = ?`, [host], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					for(server of servers) {
						super.delete(`${host}-${server}`);
					}	
					res();
				}
			})
		})
	}
}

module.exports = (bot, db) => new ServerStore(bot, db);