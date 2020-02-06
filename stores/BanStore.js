const {Collection} = require("discord.js");

class BanStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(hid, sserver, data = {}) {
		return new Promise(async (res, rej) => {
			this.db.query(`INSERT INTO ban_logs (
				hid,
				server_id,
				channel_id,
				message_id,
				users,
				reason,
				timestamp
			) VALUES (?,?,?,?,?,?,?)`,
			[hid, server, data.channel_id || "", data.message_id || "", data.users || [],
			 data.reason || "", data.timestamp || new Date().toISOString()], async (err, rows) => {
			 	if(err) {
			 		console.log(err);
			 		rej(err.message);
			 	} else {
			 		res(await this.get(hid, server));
			 	}
			 })
		})
	}

	async get(hid, server, forceUpdate = false) {
		return new Promise((res, rej) => {
			if(!forceUpdate) {
				var log = super.get(`${hid}-${server}`);
				if(log) return res(config);
			}
			
			this.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND hid = ?`,[server, hid], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						var message;
						try {
							message = await this.bot.getMessage(rows[0].channel_id, rows[0].message_id);
						} catch(e) {
							console.log(e);
						}

						if(message) rows[0].embed = message.embeds[0];
						else await this.delete(hid, server);

						this.set(`${hid}-${server}`, rows[0]);
						res(rows[0])
					} else res(undefined)
				}
			})
		})
	}

	async getByUser(server, user) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND users LIKE ?`, [server, `%"${user}"%`], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						var message;
						try {
							message = await this.bot.getMessage(rows[0].channel_id, rows[0].message_id);
						} catch(e) {
							console.log(e);
						}

						if(message) rows[0].embed = message.embeds[0];
						else await this.delete(hid, server);

						this.set(`${hid}-${server}`, rows[0]);
						res(rows[0])
					} else res(undefined)
				}
			})
		})
	}

	async getByMessage(server, channel, message) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						var message;
						try {
							message = await this.bot.getMessage(rows[0].channel_id, rows[0].message_id);
						} catch(e) {
							console.log(e);
						}

						if(message) rows[0].embed = message.embeds[0];
						else await this.delete(hid, server);

						this.set(`${hid}-${server}`, rows[0]);
						res(rows[0])
					} else res(undefined)
				}
			})
		})
	}

	async getAll(server) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM ban_logs WHERE server_id = ?`,[server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						var logs = [];
						for(var i = 0; i < rows.length; i++) {
							var message;

							try {
								message = await this.bot.getMessage(rows[i].channel_id, rows[i].message_id);
							} catch(e) {
								console.log(e.stack);
								await await this.delete(rows[i].hid, server);
								continue;
							}

							rows[i].embed = message.embeds[0];
							logs.push(rows[i]);
						}

						res(logs);
					} else res(undefined)
				}
			})
		})
	}

	async update(hid, server, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE ban_logs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=? AND hid = ?`,[...Object.values(data), server, hid], async (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					//edit post here
					res(await this.get(`${hid}-${server}`, true));
				}
			})
		})
	}

	async delete(hid, server) {
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM ban_logs WHERE server_id = ? AND hid = ?`, [server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					//delete receipt
					super.delete(`${hid}-${server}`);
					res();
				}
			})
		})
	}

	async deleteAll(server) {
		var logs = await this.getAll(server);
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM ban_logs WHERE server_id = ?`, [server], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					//delete receipts
					if(logs) {
						for(log of logs) super.delete(`${log.hid}-${server}`);
					}
					
					res();
				}
			})
		})
	}

	async scrub(server, user) {
		return new Promise(async (res, rej) => {
			var logs = await this.getByUser(server, user);
			if(!logs || !logs[0]) return res(true);

			for(var i = 0; i < logs.length; i++) {
				if(logs[i].users.length > 1) {
					logs[i].users = logs[i].users.filter(x => x != user);
					await this.update(logs[i].hid, server, {users: logs[i].users});

					var ind = logs[i].embed.fields[1].value.split("\n").indexOf(user);
					if(ind > -1) {
						var usernames = logs[i].embed.fields[0].value.split("\n");
						usernames.splice(ind, 1);
						logs[i].embed.fields[0].value = usernames.join("\n");
					}
					logs[i].embed.fields[1].value = logs[i].embed.fields[1].value.replace(new RegExp(`(?:\\n${user}|${user}\\n)`),"");
					try {
						await bot.editMessage(logs[i].channel_id, logs[i].message_id, {embed: logs[i].embed});
					} catch(e) {
						console.log(e);
						rej(e.message);
						//not much we can really do about it
					}
				} else {
					await bot.deleteMessage(logs[i].channel_id, logs[i].message_id)
				}
			}

			res(true);
		})
	}
}

module.exports = (bot, db) => new BanStore(bot, db);