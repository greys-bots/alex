module.exports = {
	addFeedbackTicket: async (bot, hid, server, user, message, anon) => {
		return new Promise(async res=> {
			bot.db.query(`INSERT INTO feedback (hid, server_id, sender_id, message, anon) VALUES (?,?,?,?,?)`,
				[hid, server, user, message, anon], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(true);
					}
				})
		})
	},
	getFeedbackTickets: async (bot, server) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ?`, [server],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(rows);
					}
				}) 
		})
	},
	getFeedbackTicket: async (bot, server, hid) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ? AND hid = ?`, [server, hid],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(rows[0]);
					}
				}) 
		})
	},
	getFeedbackTicketsFromUser: async (bot, server, id) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ? AND sender_id = ? AND anon = 0`, [server, id],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(rows);
					}
				}) 
		})
	},
	searchFeedbackTickets: async (bot, server, query) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ?`,[server],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(rows.filter(r => r.message.toLowerCase().includes(query)));
				}
			})
		})
	},
	searchFeedbackTicketsFromUser: async (bot, server, id, query) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ? AND sender_id = ? AND anon = 0`,[server, id],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(rows.filter(r => r.message.toLowerCase().includes(query)));
				}
			})
		})
	},
	deleteFeedbackTicket: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM feedback WHERE server_id = ? AND hid = ?`,[server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteFeedbackTickets: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM feedback WHERE server_id = ?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	fetchUser: async (bot, id) => {
		return new Promise(async res => {
			try {
				var user = await bot.getRESTUser(id);
			} catch(e) {
				console.log(e);
				var user = undefined;
			}
			res(user);
		})
	}
}