const {Collection} = require("discord.js");

class ReactRoleStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, role, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				this.db.query(`INSERT INTO reactroles (
					server_id,
			    	role_id,
			    	emoji,
			    	description
				) VALUES ($1,$2,$3,$4)`,
				[server, role, data.emoji || "", data.description || ""])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server));
		})
	}

	async get(server, role, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var role = super.get(`${server}-${role}`);
				if(role) return res(role);
			}

			try {
				var data = await this.db.query(`SELECT * FROM reactroles WHERE server_id = $1 AND role_id = $2`,[server, role]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				try {
					var guild = await this.bot.getRESTGuild(server);
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
				data.rows[0].raw = guild.roles.find(r => r.id == data.rows[0].role_id);
				this.set(`${server}-${role}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByReaction(server, emoji) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM reactroles WHERE server_id = $1 AND emoji = $2`,[server, emoji]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				try {
					var guild = await this.bot.getRESTGuild(server);
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
				data.rows[0].raw = guild.roles.find(r => r.id == data.rows[0].role_id);
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByRowID(server, id) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM reactroles WHERE server_id = $1 AND id = $2`,[server, id]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				try {
					var guild = await this.bot.getRESTGuild(server);
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
				data.rows[0].raw = guild.roles.find(r => r.id == data.rows[0].role_id);
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM reactroles WHERE server_id = $1 AND role_id = $2`,[server, role]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && rows[0]) {
				try {
					var guild = await this.bot.getRESTGuild(server);
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
				for(var i = 0; i < data.rows.length; i++) {
					data.rows[i].raw = guild.roles.find(r => r.id == data.rows[i].role_id);
				}
				
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, role, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE reactroles SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND role_id = $2`,[server, role, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
		})
	}

	async delete(server, role) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM reactroles WHERE server_id = $1 AND role_id = $2`, [server, role]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			super.delete(`${server}-${role}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var roles = await this.getAll(server);
				await this.db.query(`DELETE FROM reactroles WHERE server_id = $1 AND role_id = $2`, [server, role]);
				for(role of roles) super.delete(`${server}-${role.role_id}`);
			} catch(e) {
				console.log(e)
				return rej(e.message || e);
			}

			res();
		})
	}
}

module.exports = (bot, db) => new ReactRoleStore(bot, db);