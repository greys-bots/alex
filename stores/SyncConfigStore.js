const {Collection} = require("discord.js");

class SyncConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, data = {}) {
		return new Promise(async (res, rej) => {
			this.db.query(`INSERT INTO sync (
				server_id,
				sync_id,
				confirmed,
				syncable,
				sync_notifs,
				ban_notifs,
				enabled
			) VALUES (?,?,?,?,?,?,?)`,
			[server, data.sync_id, data.confirmed || false, data.syncable || false, data.sync_notifs,
			 data.ban_notifs, data.enabled || false], async (err, rows) => {
			 	if(err) {
			 		console.log(err);
			 		rej(err.message);
			 	} else {
			 		res(await this.get(server));
			 	}
			 })
		})
	}

	async get(server, forceUpdate = false) {
		return new Promise((res, rej) => {
			if(!forceUpdate) {
				var config = super.get(server);
				if(config) return res(config);
			}
			
			this.db.query(`SELECT * FROM sync WHERE server_id = ?`,[server], {
				id: Number,
				server_id: String,
				sync_id: String,
				confirmed: Boolean,
				syncable: Boolean,
				sync_notifs: String,
				ban_notifs: String,
				enabled: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						this.set(server, rows[0])
						res(rows[0])
					} else res(undefined);
				}
			})
		})
	}

	async getSynced(server) {
		return new Promise((res, rej) => {
			bot.db.query(`SELECT * FROM sync WHERE sync_id=? AND confirmed = ?`, [server, 1], (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						for(var i = 0; i < rows.length; i++) {
							var guild = bot.guilds.find(g => g.id == rows[i].server_id);
							if(guild) rows[i].guild = guild;
							else rows[i] = "invalid";
						}
						rows = rows.filter(x => x!="invalid");
						if(!rows || !rows[0]) res(undefined);
						else res(rows);
					} else res(undefined);
				}
			})
		})
	}

	async update(server, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE sync SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=?`,[...Object.values(data), server], async (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					res(await this.get(server, true));
				}
			})
		})
	}

	async delete(server) {
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM sync WHERE server_id = ?`, [server], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					super.delete(server);
					res();
				}
			})
		})
	}

	async unsync(server) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE sync SET sync_id=?, confirmed = ? WHERE sync_id = ?`, ["", 0, server], (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else res();
			})
		})
	}
}

module.exports = (bot, db) => new SyncConfigStore(bot, db);