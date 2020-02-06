module.exports = {
	getRawBanLogs: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ?`, [server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined)
				}
			})
		})
	},
	getBanLogs: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ?`, [server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var logs = [];
						for(var i = 0; i < rows.length; i++) {
							var message;

							try {
								message = await bot.getMessage(rows[i].channel_id, rows[i].message_id);
							} catch(e) {
								console.log(e.stack);
								await bot.utils.deleteBanLog(bot, rows[i].hid, server);
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
	},
	getBanLog: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE hid = ? AND server_id = ?`, [hid, server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var message = await bot.getMessage(rows[0].channel_id, rows[0].message_id);

						if(message) rows[0].embed = message.embeds[0];
						else await bot.utils.deleteBanLog(bot, rows[0].hid, server);

						res(rows[0]);

					} else res(undefined)
				}
			})
		})
	},
	getBanLogByMessage: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var message = await bot.getMessage(rows[0].channel_id, rows[0].message_id);

						if(message) rows[0].embed = message.embeds[0];
						else {
							rows[0] = "deleted";
							await deleteBanLog(bot, rows[0].hid, server)
						}

						res(rows[0]);

					} else res(undefined)
				}
			})
		})
	},
	getRawBanLogByMessage: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	getBanLogByUser: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND users LIKE ?`, [server, `%"${user}"%`], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var message = await bot.getMessage(rows[0].channel_id, rows[0].message_id);

						if(message) rows[0].embed = message.embeds[0];
						else {
							rows[0] = "deleted";
							await deleteBanLog(bot, rows[0].hid, server)
						}

						res(rows[0]);

					} else res(undefined)
				}
			})
		})
	},
	getBanLogsByUser: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND users LIKE ?`, [server, `%"${user}"%`], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var logs = [];
						for(var i = 0; i < rows.length; i++) {
							var message;

							try {
								message = await bot.getMessage(rows[i].channel_id, rows[i].message_id);
							} catch(e) {
								console.log(e.stack);
								await bot.utils.deleteBanLog(bot, rows[i].hid, server);
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
	},
	addBanLog: async (bot, hid, server, channel, message, users, reason, timestamp) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO ban_logs (hid, server_id, channel_id, message_id, users, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,[hid, server, channel, message, users, reason || "(no reason given)", timestamp || new Date()], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	deleteBanLog: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM ban_logs WHERE hid = ? AND server_id = ?`, [hid, server], async (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					var scc = await bot.utils.deleteReceipt(bot, hid, server);
					res(scc);
				}
			})
		})
	},
	deleteBanLogs: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM ban_logs server_id = ?`, [server], async (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					var scc = await bot.utils.deleteReceipts(bot, server);
					res(scc);
				}
			})
		})
	},
	scrubBanLogs: async (bot, server, user) => {
		return new Promise(async res => {
			var logs = await bot.utils.getBanLogsByUser(bot, server, user);
			if(!logs || !logs[0]) return res(true);

			for(var i = 0; i < logs.length; i++) {
				if(logs[i].users.length > 1) {
					logs[i].users = logs[i].users.filter(x => x != user);
					await bot.utils.updateBanLog(bot, logs[i].hid, server, {users: logs[i].users});

					var ind = logs[i].embed.fields[1].value.split("\n").indexOf(user);
					if(ind > -1) {
						var usernames = logs[i].embed.fields[0].value.split("\n");
						usernames.splice(ind, 1);
						logs[i].embed.fields[0].value = usernames.join("\n");
					}
					logs[i].embed.fields[1].value = logs[i].embed.fields[1].value.replace(new RegExp(`(?:\\n${user}|${user}\\n)`),"");
					console.log(logs[i].embed);
					try {
						await bot.editMessage(logs[i].channel_id, logs[i].message_id, {embed: logs[i].embed});
					} catch(e) {
						console.log(e);
						//not much we can really do about it
					}
				} else {
					await bot.deleteMessage(logs[i].channel_id, logs[i].message_id)
				}
			}

			res(true);
		})
	},
	updateBanLog: async (bot, hid, server, data) => {
		return new Promise(async res => {
			bot.db.query(`UPDATE ban_logs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE hid = ? AND server_id=?`,[...Object.values(data), hid, server], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	}
}