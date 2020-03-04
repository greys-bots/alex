const {Collection} = require("discord.js");

class BanLogStore extends Collection {
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

	async create(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO ban_logs (
					hid,
					server_id,
					channel_id,
					message_id,
					users,
					reason,
					timestamp
				) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
				[hid, server, data.channel_id || "", data.message_id || "", data.users || [],
				 data.reason || "", data.timestamp || new Date().toISOString()])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, hid));
		})
	}

	async get(server, hid, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var log = super.get(`${server}-${hid}`);
				if(log) return res(config);
			}

			try {
				var data = await this.db.query(`
					SELECT ban_logs.*,
					(SELECT row_to_json(
						(SELECT a FROM (SELECT receipts.*) a)
					) FROM receipts WHERE server_id = ban_log.server_id AND hid = ban_log.hid) AS receipt
					FROM ban_logs WHERE server_id = $1 AND hid = $2
				`, [server, hid]);
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

	async getByUser(server, user) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					SELECT ban_logs.*,
					(SELECT row_to_json(
						(SELECT a FROM (SELECT receipts.*) a)
					) FROM receipts WHERE server_id = ban_log.server_id AND hid = ban_log.hid) AS receipt
					FROM ban_logs WHERE server_id = $1 AND users LIKE $2
				`, [server, `%"${user}"%`]);
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
				else await this.delete(server, data.rows[0].hid);

				res(data.rows[0])
			} else res(undefined)
		})
	}

	async getByMessage(server, channel, message) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					SELECT ban_logs.*,
					(SELECT row_to_json(
						(SELECT a FROM (SELECT receipts.*) a)
					) FROM receipts WHERE server_id = ban_log.server_id AND hid = ban_log.hid) AS receipt
					FROM ban_logs WHERE server_id = $1 AND channel_id = $2 AND message_id = $3
				`, [server, channel, message]);
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
				else await this.delete(server, data.rows[0].hid);

				res(data.rows[0])
			} else res(undefined)
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					SELECT ban_logs.*,
					(SELECT row_to_json(
						(SELECT a FROM (SELECT receipts.*) a)
					) FROM receipts WHERE server_id = ban_log.server_id AND hid = ban_log.hid) AS receipt
					FROM ban_logs WHERE server_id = $1
				`, [server]);
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
						console.log(e.stack);
						await this.delete(server, data.rows[i].hid);
						continue;
					}

					data.rows[i].embed = message.embeds[0];
					logs.push(data.rows[i]);
				}

				res(logs);
			} else res(undefined)
		})
	}

	async update(server, hid, data) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE ban_logs SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id=$1 AND hid = $2`, [server, hid, ...Object.values(data)]);
				var ban = await this.get(server, hid, true);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}
			
			if(!ban.embed) {
				await this.delete(server, hid);
				return rej("Message for ban was deleted");
			}

			var users = await this.bot.utils.verifyUsers(this.bot, ban.users);
			if(!users.pass[0]) return rej("Users invalid");

			try {
				await this.bot.editMessage(ban.channel_id, ban.message_id, {embed: {
					title: "Members Banned",
					fields: [
					{
						name: "**__Last Known Usernames__**",
						value: (users.info.map(m => `${m.username}#${m.discriminator}`).join("\n")) || "Something went wrong"
					},
					{
						name: "**__User IDs__**",
						value: (users.info.map(m => m.id).join("\n")) || "Something went wrong"
					},
					{
						name: "**__Reason__**",
						value: ban.reason || "(no reason given)"
					}
					],
					color: 9256253,
					footer: {
						text: ban.hid
					},
					timestamp: ban.timestamp
				}})
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			res(ban);
		})
	}

	async delete(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				var ban = await this.get(server, hid);
				this.db.query(`DELETE FROM ban_logs WHERE server_id = $1 AND hid = $2`, [server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			super.delete(`${server}-${hid}`);
			this.bot.stores.receipts.delete(server, hid);
			try {
				await this.bot.deleteMessage(ban.channel_id, ban.message_id);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var logs = await this.getAll(server);
				await this.db.query(`DELETE FROM ban_logs WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			if(logs) {
				for(var log of logs) {
					super.delete(`${server}-${log.hid}`);
					try {
						await this.bot.deleteMessage(log.channel_id, log.message_id);
					} catch(e) {
						console.log(e);
						return rej(e.message);
					}
				}
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

	async handleReactions(msg, emoji, user, store) {
		return new Promise(async res => {
			try {
				msg = store.bot.getMessage(msg.channel.id, msg.id);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(!msg.guild) return res();
			
			if(!["❓","❔"].includes(emoji.name)) return;
			var log = await store.getByMessage(msg.channel.guild.id, msg.channel.id, msg.id);
			if(!log) return res();

			try {
				await msg.removeReaction(emoji.name, user);
			} catch(e) {
				console.log(e);
				//don't need to stop, technically
			}

			var ch = await store.bot.getDMChannel(user);
			if(!ch) return rej("Couldn't get user DM channel");

			try {
				if(!log.receipt) return ch.createMessage("No receipt has been registered for that ban :(");
				var users = await store.bot.utils.verifyUsers(bot, log.embed.fields[1].value.split("\n"));
				ch.createMessage({embed: {
					title: "Ban Receipt",
					description: log.receipt.message,
					fields: [
						{name: "Users Banned", value: users.info.map(u => `${u.username}#${u.discriminator} (${u.id})`).concat(users.fail.map(u => `${u} - Member deleted?`)).join("\n")},
						{name: "Reason", value: log.reason}
					]
				}})	
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			res();
		});
	}
}

module.exports = (bot, db) => new BanLogStore(bot, db);