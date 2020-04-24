const {Collection} = require("discord.js");

class ReceiptStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO receipts (
					hid,
					server_id,
					message,
					link
				) VALUES ($1,$2,$3,$4)`,
				[hid, server, data.message, data.link])
			} catch(e) {
				console.log(e);
		 		rej(e.message);
			}
			
			res(await this.get(server, hid));
		})
	}

	async index(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO receipts (
					hid,
					server_id,
					message,
					link
				) VALUES ($1,$2,$3,$4)`,
				[hid, server, data.message, data.link])
			} catch(e) {
				console.log(e);
		 		rej(e.message);
			}
			
			res();
		})
	}

	async get(server, hid, forceUpdate = false) {
		return new Promise((res, rej) => {
			if(!forceUpdate) {
				var receipt = super.get(`${server}-${hid}`);
				if(receipt) return res(receipt);
			}
			
			this.db.query(`SELECT receipts.*, (SELECT * FROM receipts WHERE link = receipts.hid) as linked FROM receipts WHERE server_id = $1 AND hid = $2`,[server, hid], {
				id: Number,
				hid: String,
				server_id: String,
				message: String,
				link: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) {
						this.set(`${server}-${hid}`, rows[0])
						res(rows[0])
					} else res(undefined);
				}
			})
		})
	}

	async getAll(server) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM receipts WHERE server_id = $1`,[server], {
				id: Number,
				hid: String,
				server_id: String,
				message: String,
				link: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) res(rows);
					else res(undefined);
				}
			})
		})
	}

	async getLinked(server, hid) {
		return new Promise((res, rej) => {
			this.db.query(`SELECT * FROM receipts WHERE server_id = $1 AND link = $2`,[server, link], {
				id: Number,
				hid: String,
				server_id: String,
				message: String,
				link: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					if(rows[0]) res(rows);
					else res(undefined);
				}
			})
		})
	}

	async update(server, hid, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE receipts SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND hid = $2`,[server, hid, ...Object.values(data)], async (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					res(await this.get(server, hid, true));
				}
			})
		})
	}

	async delete(server, hid) {
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM receipts WHERE server_id = $1 AND hid = $2`, [server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					super.delete(`${server}-${hid}`);
					res();
				}
			})
		})
	}

	async deleteAll(server) {
		try {
			var receipts = await this.getAll(server);
		} catch(e) {
			return rej(e);
		}
		
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM receipts WHERE server_id = $1`, [server], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					for(var receipt of receipts) super.delete(`${server}-${receipt.hid}`);
					res();
				}
			})
		})
	}

	async link(server, hid1, hid2, message) {
		return new Promise(async (res, rej) => {
			var r1, r2;
			try {
				r1 = await this.get(server, hid1);
				r2 = await this.get(server, hid2);
			} catch(e) {
				return rej(e);
			}

			if(!(r1 && r2)) return rej("Neither receipt exists");
			if(r1 && r2) {
				try {
					await this.update(server, hid1, {message, link: r2.link || hid2});
					await this.update(server, hid2, {message, link: r2.link || hid2});	
				} catch(e) {
					return rej(e);
				}
			} else if(!r1) {
				try {
					r1 = await this.create(server, hid1, {message, link: r2.link || hid2});
					await this.update(server, hid2, {message, link: r2.link || hid2});
				} catch(e) {
					return rej(e);
				}
			} else if(!r2) {
				try {
					r2 = await this.create(server, hid2, {message, link: hid2});
					await this.update(server, hid1, {message, link: hid2});
				} catch(e) {
					return rej(e);
				}
			}

			res();
		})
	}
}

module.exports = (bot, db) => new ReceiptStore(bot, db);