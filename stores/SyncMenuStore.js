const {Collection} = require("discord.js");

class SyncMenuStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on("messageReactionAdd", async (...args) => {
			await this.handleReactions(...args);
		})

		this.bot.on('messageDelete', async (msg) => {
			return new Promise(async (res, rej) => {
				if(msg.channel.type == 1) return;

				try {
					var menu = await this.get(msg.channel.guild.id, msg.channel.id, msg.id);
					if(!menu) return res();
					await this.delete(menu.server_id, menu.channel_id, menu.message_id);
				} catch(e) {
					console.log(e);
					return rej(e.message || e);
				}
			})	
		})
	}

	async create(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO sync_menus (
					server_id,
					channel_id,
					message_id,
					type,
					reply_guild,
					reply_channel
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[server, channel, message, data.type, data.reply_guild, data.reply_channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(`${server}-${channel}-${message}`));
		})
	}

	async index(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO sync_menus (
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

			res();
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

	async getRequest(server, requester) {
		return new Promise(async (res, rej) => {
			var cfg = await this.bot.stores.syncConfigs.get(requester);
			if(!cfg || !cfg.sync_id || cfg.sync_id != server) return rej("Requester is not synced to that server");

			try {
				var data = await this.db.query(`SELECT * FROM sync_menus WHERE server_id = $1 AND reply_guild = $2`,[server, requester]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			var request = {};
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					try {
						var msg = await this.bot.getMessage(data.rows[i].channel_id, data.rows[i].message_id);
					} catch(e) {
						console.log(e.message);
					}
					if(msg) continue;
					else {
						await this.delete(data.rows[i].server_id, data.rows[i].channel_id, data.rows[i].message_id);
						data.rows[i] = undefined;
					}
				}

				data.rows = data.rows.filter(x => x!=undefined);
				request = {
					channel: data.rows[0].channel_id,
					message: data.rows[0].message_id,
					requester: data.rows[0].reply_guild,
					requester_channel: data.rows[0].reply_channel,
					confirmed: cfg.confirmed
				};
			} else {
				request = {
					requester: cfg.server_id,
					requester_channel: cfg.sync_notifs,
					confirmed: cfg.confirmed
				};
			}

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

	async handleReactions(message, emoji, user) {
		return new Promise(async (res, rej) => {
			if(this.bot.user.id == user) return res();
			try {
				message = await this.bot.getMessage(message.channel.id, message.id);
				var smenu = await this.get(message.channel.guild.id, message.channel.id, message.id);
				if(!smenu) return res();
				if(!["✅", "❌"].includes(emoji.name)) return res();
				var request = await this.getRequest(message.channel.guild.id, smenu.reply_guild);
				if(!request) return res();
				console.log(request);
				var embed = message.embeds[0];
				var member = await this.bot.utils.fetchUser(this.bot, user);
				await this.bot.removeMessageReaction(message.channel.id, message.id, emoji.name, user);
			} catch(e) {
				if(!e.message.toLowerCase().includes('unknown message')) console.log(e);
				return rej(e.message || e);
			}
				
			switch(emoji.name) {
				case "✅":
					if(request.confirmed) return res();

					try {
						if(embed) {
							embed.fields[2].value = "Confirmed";
							embed.color = parseInt("55aa55", 16);
							embed.author = {
								name: `Accepted by: ${member.username}#${member.discriminator} (${member.id})`,
								icon_url: member.avatarURL
							}
							await this.bot.editMessage(message.channel.id, message.id, {embed: embed});
						}
					} catch(e) {
						console.log(e);
						message.channel.createMessage("Notification for this request couldn't be updated; the request can still be confirmed, however");
					}

					try {
						await this.bot.stores.syncConfigs.update(smenu.reply_guild, {confirmed: true});
						await this.bot.createMessage(smenu.reply_channel, {embed: {
							title: "Sync Acceptance",
							description: `Your sync request with ${message.guild.name} has been accepted!`,
							color: parseInt("55aa55", 16),
							timestamp: new Date().toISOString()
						}});
					} catch(e) {
						console.log(e);
						if(e.message) message.channel.createMessage("Couldn't send the requester the acceptance notification; please make sure they're aware that their server was accepted and that they should use `hub!ban notifs [channel]` if they want ban notifications");
						else message.channel.createMessage("Couldn't update the request. Please try again");
						return rej(e.message || e);
					}
					break;
				case "❌":
					try {
						if(embed) {
							embed.fields[2].value = "Denied";
							embed.color = parseInt("aa5555", 16);
							embed.author = {
								name: `Denied by: ${member.username}#${member.discriminator} (${member.id})`,
								icon_url: member.avatarURL
							}
							await this.bot.editMessage(message.channel.id, message.id, {embed: embed});
							await this.delete(message.channel.guild.id, message.channel.id, message.id);
						}
					} catch(e) {
						console.log(e);
						message.channel.createMessage("Notification for this request couldn't be updated; the request can still be confirmed, however");
					}

					try {
						await this.bot.stores.syncConfigs.update(smenu.reply_guild, {confirmed: false, sync_id: null});
						await this.bot.createMessage(smenu.reply_channel, {embed: {
							title: "Sync Denial",
							description: `Your sync request with ${message.guild.name} has been denied.${request.confirmed ? " You'll no longer receive notifications from this server." : ""}`,
							color: parseInt("aa5555", 16),
							timestamp: new Date().toISOString()
						}});
						await this.bot.removeMessageReactions(message.channel.id, message.id);
					} catch(e) {
						console.log(e);
						if(e.message) message.channel.createMessage("Couldn't send the requester the acceptance notification; please make sure they're aware that their server was accepted and that they should use `hub!ban notifs [channel]` if they want ban notifications");
						else message.channel.createMessage("Couldn't update the request. Please try again");
						return rej(e.message || e);
					}
					break;
			}
			res();
		})
	}
}

module.exports = (bot, db) => new SyncMenuStore(bot, db);