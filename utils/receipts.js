module.exports = {
	getReceipts: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM receipts WHERE server_id = ?`, [server], 
			{
				id: Number,
				hid: String,
				server_id: String,
				message: String,
				link: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows)
				}
			})
		})
	},
	getReceipt: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM receipts WHERE hid = ? AND server_id = ?`, [hid, server],
			{
				id: Number,
				hid: String,
				server_id: String,
				message: String,
				link: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	addReceipt: async (bot, hid, server, message) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO receipts (hid, server_id, message, link) VALUES (?, ?, ?, ?)`, [hid, server, message, ""], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	},
	editReceipt: async (bot, hid, server, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE receipts SET ? = ? WHERE hid = ? AND server_id = ?`, [key, val, hid, server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	},
	deleteReceipt: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM receipts WHERE hid = ? AND server_id = ?`, [hid, server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	deleteReceipts: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM receipts WHERE server_id = ?`, [server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	linkReceipts: async (bot, server, hid1, hid2, message) => {
		return new Promise(async res => {
			var receipt = await bot.utils.getReceipt(bot, hid1, server);
			var receipt2 = await bot.utils.getReceipt(bot, hid2, server);
			if(!receipt) {
				bot.db.query(`INSERT INTO receipts (hid, server_id, message, link) VALUES (?,?,?,?)`, [hid1, server, message, receipt2.link || hid2], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false);
					} else {
						bot.db.query(`UPDATE receipts SET message=?, link=? WHERE hid=? AND server_id=?`, [message, receipt2.link || hid2, hid2, server], (err, rows)=> {
							if(err) {
								console.log(err);
								res(false);
							} else {
								res(true)
							}
						})
						
					}
				})
			} else if(!receipt2) {
				bot.db.query(`INSERT INTO receipts (hid, server_id, message, link) VALUES (?,?,?,?)`, [hid2, server, message, hid2], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false);
					} else {
						bot.db.query(`UPDATE receipts SET message=?, link=? WHERE hid=? AND server_id=?`, [message, hid2, hid1, server], (err, rows)=> {
							if(err) {
								console.log(err);
								res(false);
							} else {
								res(true)
							}
						})
					}
				})
			} else {
				bot.db.query(`UPDATE receipts SET message=?, link=? WHERE hid=? AND server_id=?;
							  UPDATE receipts SET message=?, link=? WHERE hid=? AND server_id=?`,
							  [message, receipt2.link || hid2, hid1, server,
							   message, receipt2.link || hid2, hid2, server], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false);
					} else {
						res(true)
					}
				})
			}
		})
	},
	getLinkedReceipts: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM receipts WHERE link = ? AND server_id = ?`, [hid, server],
			{
				id: Number,
				hid: String,
				server_id: String,
				message: String,
				link: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows)
				}
			})
		})
	}
}