const {Collection} = require("discord.js");

class ServerStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on("guildDelete", async (guild) => {
			return new Promise(async (res, rej) => {
				try {
					var data = await this.bot.utils.getExportData(bot, guild.id);
					var ch = await this.bot.getDMChannel(guild.ownerID);
					if(!ch) return;
					ch.createMessage(["Hi! I'm sending you this because you removed me from your server. ",
						"After 24 hours, all the data I have indexed for it will be deleted. ",
						"If you invite me back after 24 hours are up and would like to start up ",
						"where you left off, you can use this file to do so:"].join(""),
						[{file: Buffer.from(JSON.stringify(data)), name: "export_data.json"}]);
				} catch(e) {
					console.log("Error attempting to export/deliver data after being kicked:\n"+e.stack)
				}
			})
		})
	}

	async create(host, server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO servers (
					host_id,
					server_id,
					contact_id,
					name,
					description,
					invite,
					pic_url,
					color,
					visibility
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
				[host, server, (
					data.contact_id && typeof data.contact_id == "string" ? 
					[data.contact_id] : data.contact_id
				), data.name, data.description, data.invite, data.pic_url,
				data.color, data.visibility]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(host, server));
		})
	}

	async index(host, server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO servers (
					host_id,
					server_id,
					contact_id,
					name,
					description,
					invite,
					pic_url,
					color,
					visibility
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
				[host, server, (
					data.contact_id && typeof data.contact_id == "string" ? 
					[data.contact_id] : data.contact_id
				), data.name, data.description, data.invite, data.pic_url,
				data.color, data.visibility]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(host, server, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var srv = super.get(`${host}-${server}`);
				if(srv) return res(srv);
			}

			try {
				var data = await this.db.query(`SELECT * FROM servers WHERE host_id = $1 AND server_id = $2`,[host, server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				data.rows[0].guild = this.bot.guilds.find(g => g.id == data.rows[0].server_id);
				data.rows[0].posts = await this.bot.stores.serverPosts.getByHostedServer(host, data.rows[0].server_id);
				this.set(`${host}-${server}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getRaw(host, server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM servers WHERE host_id = $1 AND server_id = $2`,[host, server]);
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

	async getByID(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM servers WHERE server_id = $1`,[server]);
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
				var data = await this.db.query(`SELECT * FROM servers WHERE id = $1`,[id]);
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
				var data = await this.db.query(`SELECT * FROM servers WHERE host_id = $1`,[host]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					data.rows[i].guild = this.bot.guilds.find(g => g.id == data.rows[i].server_id);
					data.rows[i].posts = await this.bot.stores.serverPosts.getByHostedServer(host, data.rows[i].server_id);
				}
				res(data.rows)
			} else res(undefined);
		})
	}

	async getWithContact(host, user) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM servers WHERE host_id = $1 AND $2=ANY(contact_id)`,[host, user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++)
					data.rows[i].guild = this.bot.guilds.find(g => g.id == data.rows[i].server_id);

				res(data.rows)
			} else res(undefined);
		})
	}

	async find(host, query) {
		return new Promise(async (res, rej) => {
			var data;
			try {
				//Allows searching by ID too, without worrying about pg errors
				if(isNaN(parseInt(query))) data = await this.db.query(`SELECT * FROM servers WHERE host_id = $1 AND LOWER(name) LIKE $2`, [host, `%${query}%`]);
				else data = await this.db.query(`SELECT * FROM servers WHERE host_id = $1 AND (LOWER(name) LIKE $2 OR server_id = $3)`, [host, `%${query}%`, parseInt(query)])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++)
					data.rows[i].guild = this.bot.guilds.find(g => g.id == data.rows[i].server_id);

				res(data.rows)
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

	async updateByID(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE servers SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE server_id = $1`,[server, ...Object.values(data)]);
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