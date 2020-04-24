const {Collection} = require("discord.js");

class ListingLogStore extends Collection {
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
					var log = await this.get(msg.channel.guild.id, msg.channel.id, msg.id);
					if(!log) return;
					await this.delete(log.server_id, log.hid);
				} catch(e) {
					console.log(e);
					return rej(e.message || e);
				}
			})	
		})
	}

	async create(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO listing_logs (
					hid,
					server_id,
					channel_id,
					message_id,
					server_name,
					reason,
					timestamp,
					type
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
				[hid, server, data.channel_id || "", data.message_id || "", data.server_name || "",
				 data.reason || "", data.timestamp || new Date().toISOString(), data.type || 0]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, hid));
		})
	}

	async index(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO listing_logs (
					hid,
					server_id,
					channel_id,
					message_id,
					server_name,
					reason,
					timestamp,
					type
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
				[hid, server, data.channel_id || "", data.message_id || "", data.server_name || "",
				 data.reason || "", data.timestamp || new Date().toISOString(), data.type || 0]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, hid, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var log = super.get(`${server}-${hid}`);
				if(log) return res(config);
			}

			try {
				var data = await this.db.query(`SELECT * FROM listing_logs WHERE server_id = $1 AND hid = $2`,[server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				var message;
				try {
					message = await this.bot.getMessage(data.rows[0].channel_id, data.rows[0].message_id);
				} catch(e) {
					console.log(e);
				}

				if(message) data.rows[0].embed = message.embeds[0];
				else await this.delete(server, hid);

				this.set(`${server}-${hid}`, data.rows[0]);
				res(data.rows[0])
			} else res(undefined)
		})
	}

	async getByMessage(server, channel, message) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM listing_logs WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`, [server, channel, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				var message;
				try {
					message = await this.bot.getMessage(data.rows[0].channel_id, data.rows[0].message_id);
				} catch(e) {
					console.log(e);
				}

				if(message) data.rows[0].embed = message.embeds[0];
				else await this.delete(server, hid);

				this.set(`${server}-${hid}`, data.rows[0]);
				res(data.rows[0])
			} else res(undefined)
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM listing_logs WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				var logs = [];
				for(var i = 0; i < data.rows.length; i++) {
					var message;

					try {
						message = await this.bot.getMessage(data.rows[i].channel_id, data.rows[i].message_id);
					} catch(e) {
						console.log(e.message);
						await this.delete(server, data.rows[i].hid);
						continue;
					}

					data.rows[i].embed = message.embeds[0];
					logs.push(data.rows[i]);
				}

				console.log(logs);
				res(logs);
			} else res(undefined)
		})
	}

	async update(server, hid, data) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE listing_logs SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND hid = $2`,[server, hid, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			try {
				var log = await this.get(server, hid, true);
			} catch(e) {
				return rej(e);
			}
			
			if(!log.embed) {
				await this.delete(server, hid);
				return rej("Message for log was deleted");
			}
			log.embed.fields[1].value = log.reason;

			try {
				await this.bot.editMessage(ban.channel_id, ban.message_id, {embed: log.embed})
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			res(log);
		})
	}

	async delete(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM listing_logs WHERE server_id = $1 AND hid = $2`, [server, hid]);
				await this.db.query(`DELETE FROM listing_logs WHERE server_id = $1 AND hid = $2`, [server, hid]);
				super.delete(`${server}-${hid}`);
				if(data.rows && data.rows[0]) await this.bot.deleteMessage(data.rows[0].channel_id, data.rows[0].message_id);
			} catch(e) {
				console.log(e);
				if(!e.message.includes("Unknown Message")) return rej(e.message);
			}

			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var logs = await this.getAll(server);
			} catch(e) {
				return rej(e);
			}

			try {
				this.db.query(`DELETE FROM listing_logs WHERE server_id = $1`, [server]);
				for(var log of logs) {
					super.delete(`${server}-${log.hid}`);
					this.bot.stores.receipts.delete(server, log.hid);
					await this.bot.deleteMessage(log.channel_id, log.message_id);
				}
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			res();
		})
	}

	async scrub(server, user) {
		return new Promise(async (res, rej) => {
			var logs = await this.getByUser(server, user);
			if(!logs || !logs[0]) return res(true);

			for(var i = 0; i < logs.length; i++) {
				if(logs[i].users.length > 1) {
					logs[i].users = logs[i].users.filter(x => x != user);
					try {
						await this.update(server, logs[i].hid, {users: logs[i].users});
					} catch(e) {
						return rej(e);
					}
				} else {
					try {
						await this.delete(server, logs[i].hid);
					} catch(e) {
						return rej(e);
					}
				}
			}
			res(true);
		})
	}
}

module.exports = (bot, db) => new ListingLogStore(bot, db);