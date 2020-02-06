const {Collection} = require("discord.js");

class ConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, data = {}) {
		return new Promise(async (res, rej) => {
			this.db.query(`INSERT INTO configs (
				server_id,
				banlog_channel,
				ban_message,
				reprole,
				delist_channel,
				starboard,
				blacklist,
				feedback
			) VALUES (?,?,?,?,?,?,?,?)`,
			[server, data.banlog_channel || "", data.ban_message || "", data.reprole || "", data.delist_channel || "",
			 data.starboard || {}, data.blacklist || [], data.feedback || {}], async (err, rows) => {
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
			
			this.db.query(`SELECT * FROM configs WHERE server_id = ?`,[server], {
				id: Number,
		        server_id: String,
		        banlog_channel: String,
		        ban_message: String,
		        reprole: String,
		        delist_channel: String,
		        starboard: val => val ? JSON.parse(val) : null,
		        blacklist: val => val ? JSON.parse(val) : null,
		        feedback: val => val ? JSON.parse(val) : null
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

	async update(server, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE configs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=?`,[...Object.values(data), server], async (err, rows)=> {
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
			this.db.query(`DELETE FROM configs WHERE server_id = ?`, [server], (err, rows) => {
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
}

module.exports = (bot, db) => new ConfigStore(bot, db);