const {Collection} = require("discord.js");

class SyncMenuStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, channel, message, data = {}) {
		return new Promise(res => {
			bot.db.query(`INSERT INTO sync_menus (
				server_id,
				channel_id,
				message_id,
				type,
				reply_guild,
				reply_channel
			) VALUES (?,?,?,?,?,?)`,
			[server, channel, message, data.type, data.reply_server, data.reply_channel],
			(err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(await this.get(`${server}-${channel}-${message}`));
		  })
		})
	}

	async get(server, channel, message, forceUpdate = false) {
		return new Promise((res, rej) => {
			if(!forceUpdate) {
				var menu = super.get(`${server}-${channel}-${message}`);
				if(menu) return res(menu);
			}
			
			this.db.query(`SELECT * FROM sync_menus WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[server, channel, message], {
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String,
				type: Number,
				reply_guild: String,
				reply_channel: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						this.set(`${server}-${channel}-${message}`, rows[0])
						res(rows[0])
					} else res(undefined);
				}
			})
		})
	}

	async getRequest(server, requester, forceUpdate = false) {
		var cfg = await this.get(requester);
		if(!cfg || !cfg.sync_id || cfg.sync_id != server) return Promise.reject("Requester is not synced to that server");
		return new Promise((res, rej) => {
			if(!forceUpdate) {
				var menu = super.get(`${server}-${requester}`);
				if(menu) return res(menu);
			}
			
			this.db.query(`SELECT * FROM sync_menus WHERE server_id = ? AND reply_guild = ?`,[server, requester], {
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String,
				type: Number,
				reply_guild: String,
				reply_channel: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					var data = {};
					if(rows[0]) {
						data = {
							channel: rows[0].channel_id,
							message: rows[0].message_id,
							requester: rows[0].reply_guild,
							requester_channel: rows[0].reply_channel,
							confirmed: scfg.confirmed
						};
					} else {
						data = {
							requester: scfg.server_id,
							requester_channel: scfg.sync_notifs,
							confirmed: scfg.confirmed
						};
					}

					this.set(`${server}-${requester}`, data);
					res(data);
				}
			})
		})
	}

	async update(server, channel, message, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE sync_menus SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[...Object.values(data), server, channel, message], async (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					res(await this.get(`${server}-${channel}-${message}`, true));
				}
			})
		})
	}

	async delete(server, channel, message) {
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM sync_menus WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					super.delete(`${server}-${channel}-${message}`);
					res();
				}
			})
		})
	}
}

module.exports = (bot, db) => new SyncMenuStore(bot, db);