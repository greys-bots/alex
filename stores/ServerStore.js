const {Collection} = require("discord.js");

class ServerStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(host, server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO servers (
					host_id,
					server_id,
					name,
					invite,
					pic_url
				) VALUES ($1,$2,$3,$4,$5)`,
				[host, server, data.name || "",
				data.invite || "", data.pic_url || ""]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(host, server));
		})
	}

	async get(host, server, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var srv = super.get(`${host}-${server}`);
				if(srv) return res(srv);
			}

			try {
				await this.db.query(`SELECT * FROM servers WHERE host_id = $1 AND server_id = $2`,[host, server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				data.rows[0].guild = this.bot.guilds.find(g => g.id == data.rows[0].server_id);
				this.set(`${host}-${server}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByID(server) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`SELECT * FROM servers WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				data.rows[0].guild = this.bot.guilds.find(g => g.id == data.rows[0].server_id);
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByRowID(id) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`SELECT * FROM servers WHERE id = $1`,[id]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				data.rows[0].guild = this.bot.guilds.find(g => g.id == data.rows[0].server_id);
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(host) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`SELECT * FROM servers WHERE host_id = $1`,[host]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++)
					data.rows[i].guild = this.bot.guilds.find(g => g.id == data.rows[i].server_id);

				res(data.rows[i])
			} else res(undefined);
		})
	}

	async getAllWithContact(host, user) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`SELECT * FROM servers WHERE host_id = $1 AND contact_id LIKE $2`,[host, "%"+user+"%"]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++)
					data.rows[i].guild = this.bot.guilds.find(g => g.id == data.rows[i].server_id);

				res(data.rows[i])
			} else res(undefined);
		})
	}

	async find(host, query) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`SELECT * FROM servers WHERE host_id = $1 AND (name LIKE $2 OR id = $3)`, [host, "%"+query+"%", query]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++)
					data.rows[i].guild = this.bot.guilds.find(g => g.id == data.rows[i].server_id);

				res(data.rows[i])
			} else res(undefined);
		})
	}

	async update(host, server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE servers SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE host_id = $1 AND server_id = $2`,[host, server, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(host, server, true));
		})
	}

	async updateByID(server, data) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE servers SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1`,[server, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.getByID(server));
		})
	}

	async delete(host, server) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM servers WHERE host_id = $1 AND server_id = $2`, [host, server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${host}-${server}`);
			res();
		})
	}

	async deleteAll(host) {
		return new Promise(async (res, rej) => {
			try {
				var servers = await this.getAll(host);
				await this.db.query(`DELETE FROM servers WHERE host_id = $1`, [host]);
				for(server of servers) super.delete(`${host}-${server.server_id}`);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new ServerStore(bot, db);