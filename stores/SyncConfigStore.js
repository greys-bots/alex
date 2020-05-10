const {Collection} = require("discord.js");

class SyncConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on("guildMemberAdd", async (guild, member) => {
			return new Promise(async (res, rej) => {
				//notify current guild if the user is banned from their synced server
				var scfg = await this.get(guild.id);
				if(!scfg || (!scfg.sync_id && !scfg.confirmed) || !scfg.ban_notifs) return;
				var logs = await this.bot.stores.banLogs.getByUser(scfg.sync_id, member.id);
				if(!logs || !logs[0]) return res();
				try {
					await this.bot.createMessage(scfg.ban_notifs, {embed: {
						title: "Ban Notification",
						description: [
							`New member **${member.username}#${member.discriminator}** (${member.id})`,
							` has been banned from your currently synced server.\n`,
							`Reason:\n`,
							logs[0].embed.fields[2].value
						].join(""),
						color: parseInt("aa5555", 16)
					}})
				} catch(e) {
					console.log(e);
				}
			})
		})
	}

	async create(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO sync (
					server_id,
					sync_id,
					confirmed,
					syncable,
					sync_notifs,
					ban_notifs,
					enabled
				) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
				[server, data.sync_id, data.confirmed || false, data.syncable || false,
				data.sync_notifs, data.ban_notifs, data.enabled || false]);
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
				await this.db.query(`INSERT INTO sync (
					server_id,
					sync_id,
					confirmed,
					syncable,
					sync_notifs,
					ban_notifs,
					enabled
				) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
				[server, data.sync_id, data.confirmed || false, data.syncable || false,
				data.sync_notifs, data.ban_notifs, data.enabled || false]);
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
				var data = await this.db.query(`SELECT * FROM sync WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				console.log(data.rows[0]);
				this.set(server, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getSynced(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM sync WHERE sync_id = $1 AND confirmed = $2`, [server, 1]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					var guild = this.bot.guilds.find(g => g.id == data.rows[i].server_id);
					if(guild) data.rows[i].guild = guild;
					else data.rows[i] = "invalid";
				}
				data.rows = data.rows.filter(x => x!="invalid");
				if(!data.rows || !data.rows[0]) res(undefined);
				else res(data.rows);
			} else res(undefined);
		})
	}

	async update(server, data) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE sync SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE server_id = $1`,[server, ...Object.values(data)]);
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
				await this.db.query(`DELETE FROM sync WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(server);
			res();
		})
	}

	async unsync(server) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE sync SET sync_id = $1, confirmed = $2 WHERE sync_id = $3`, ["", 0, server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new SyncConfigStore(bot, db);