const {Collection} = require("discord.js");

class SyncMenuStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, channel, message, data = {}) {
		return new Promise(res => {
			try {
				await bot.db.query(`INSERT INTO sync_menus (
					server_id,
					channel_id,
					message_id,
					type,
					reply_guild,
					reply_channel
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[server, channel, message, data.type, data.reply_server, data.reply_channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(`${server}-${channel}-${message}`));
		})
	}

	async get(server, channel, message, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var menu = super.get(`${server}-${channel}-${message}`);
				if(menu) return res(menu);
			}

			try {
				var data = await this.db.query(`SELECT * FROM sync_menus WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`,[server, channel, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(`${server}-${channel}-${message}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getRequest(server, requester, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			var cfg = await this.get(requester);
			if(!cfg || !cfg.sync_id || cfg.sync_id != server) return rej("Requester is not synced to that server");

			if(!forceUpdate) {
				var menu = super.get(`${server}-${requester}`);
				if(menu) return res(menu);
			}

			try {
				var data = await this.db.query(`SELECT * FROM sync_menus WHERE server_id = $1 AND reply_guild = $2`,[server, requester]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			var request = {};
			if(rows[0]) {
				request = {
					channel: data.rows[0].channel_id,
					message: data.rows[0].message_id,
					requester: data.rows[0].reply_guild,
					requester_channel: data.rows[0].reply_channel,
					confirmed: scfg.confirmed
				};
			} else {
				request = {
					requester: scfg.server_id,
					requester_channel: scfg.sync_notifs,
					confirmed: scfg.confirmed
				};
			}

			this.set(`${server}-${requester}`, request);
			res(request);
		})
	}

	async update(server, channel, message, data) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE sync_menus SET ${Object.keys(data).map((k, i) => k+"=$"+(i+4)).join(",")} WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`,[server, channel, message, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(`${server}-${channel}-${message}`, true));
		})
	}

	async delete(server, channel, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM sync_menus WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`, [server, channel, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${channel}-${message}`);
			res();
		})
	}
}

module.exports = (bot, db) => new SyncMenuStore(bot, db);