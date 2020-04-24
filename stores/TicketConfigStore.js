const {Collection} = require("discord.js");

class TicketConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO ticket_configs (
					server_id,
					category_id,
					archives_id
				) VALUES ($1,$2,$3)`,
				[server, data.category_id, data.archives_id]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server));
		})
	}

	async index(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO ticket_configs (
					server_id,
					category_id,
					archives_id
				) VALUES ($1,$2,$3)`,
				[server, data.category_id, data.archives_id]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var config = super.get(server);
				if(config) return res(config);
			}

			try {
				var data = await this.db.query(`SELECT * FROM ticket_configs WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(server, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async update(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE ticket_configs SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE server_id = $1`,[...Object.values(data), server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(server, true));
		})
	}

	async delete(server) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM ticket_configs WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(server);
			res();
		})
	}
}

module.exports = (bot, db) => new TicketConfigStore(bot, db);