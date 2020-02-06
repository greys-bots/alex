module.exports = {
	getCustomCommands: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM commands WHERE server_id=?`,[id],
				{
					id: Number,
					server_id: String,
					name: String,
					actions: JSON.parse,
					target: String,
					del: Number
				}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	getCustomCommand: async (bot, id, name) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM commands WHERE server_id=? AND name=?`,[id, name],
				{
					id: Number,
					server_id: String,
					name: String,
					actions: JSON.parse,
					target: String,
					del: Number
				}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	addCustomCommand: async (bot, server, name, actions, target, del) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO commands (server_id, name, actions, target, del) VALUES (?,?,?,?,?)`,[server, name, actions, target, del], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteCustomCommand: async (bot, server, name) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM commands WHERE server_id=? AND name=?`,[server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteCustomCommands: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM commands WHERE server_id=?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	}
}