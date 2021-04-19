const {Collection} = require("discord.js");

class EditRequestStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on("messageReactionAdd", async (...args) => {
			await this.handleReactions(...args);
		})
	}

	async create(host, channel, message, server, user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO edit_requests (
					host_id,
					channel_id,
					message_id,
					server_id,
					user_id,
					data
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[host, channel, message, server, user, data]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(host, channel, message));
		})
	}

	async index(host, channel, message, server, user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO edit_requests (
					host_id,
					channel_id,
					message_id,
					server_id,
					user_id,
					data
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[host, channel, message, server, user, data]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(host, channel, message, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var request = super.get(`${host}-${channel}-${message}`);
				if(request) return res(request);
			}

			try {
				var data = await this.db.query(`SELECT * FROM edit_requests WHERE host_id = $1 AND channel_id = $2 AND message_id = $3`,[host, channel, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(`${host}-${channel}-${message}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(host) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM edit_requests WHERE host_id = $1`,[host]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async getByUser(host, user) {
		return new Promise(async (res, rej) => {	
			try {
				var data = await this.db.query(`SELECT * FROM edit_requests WHERE host_id = $1 AND user_id = $2`, [host, user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);	
		})
	}

	async search(host, query = {}) {
		return new Promise(async (res, rej) => {
			var requests;
			try {
				if(query.sender_id) requests = await this.getByUser(host, query.sender_id);
				else requests = await this.getAll(host);
			} catch(e) {
				return rej(e)
			}
			if(!requests) return res(undefined);

			if(query.server_id) requests.filter(r => r.server_id == query.server_id);

			if(requests[0]) res(requests);
			else res(undefined);
		})
	}

	async update(host, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE edit_requests SET ${Object.keys(data).map((k, i) => k+"=$"+(i+4)).join(",")} WHERE host_id = $1 AND channel_id = $2 AND message_id = $3`,[host, channel, message, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(host, channel, message, true));
		})
	}

	async delete(host, channel, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM edit_requests WHERE host_id = $1 AND channel_id = $2 AND message_id = $3`, [host, channel, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${host}-${channel}-${message}`);
			res();
		})
	}

	async deleteAll(host) {
		return new Promise(async (res, rej) => {
			try {
				var requests = await this.getAll(host);	
			} catch(e) {
				return rej(e);
			}

			try {
				await this.db.query(`DELETE FROM edit_requests WHERE host_id = $1 AND channel_id = $2 AND message_id = $3`, [host, channel, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			for(request of requests) super.delete(`${host}-${request.channel}-${request.message}`);
			res();
		})
	}

	async handleReactions(message, emoji, user) {
		return new Promise(async (res, rej) => {
			if(this.bot.user.id == user.id) return res();
			if(!message.channel.guild) return;
			if(!["✅", "❌"].includes(emoji.name)) return res();
			try {
				message = await this.bot.getMessage(message.channel.id, message.id);
				var request = await this.get(message.channel.guild.id, message.channel.id, message.id);
				if(!request) return res();
				
				var embed = message.embeds[0];
				var member = await this.bot.utils.fetchUser(this.bot, user.id);
				var channel = await this.bot.getDMChannel(request.user_id);
			} catch(e) {
				if(!e.message.toLowerCase().includes('unknown message')) console.log(e.message || e);
				return rej(e.message || e);
			}
				
			switch(emoji.name) {
				case "✅":
					try {
						if(embed) {
							embed.author = {
								name: `Accepted by: ${member.username}#${member.discriminator} (${member.id})`,
								icon_url: member.avatarURL
							}
							await this.bot.editMessage(message.channel.id, message.id, {
								content: "Edit request accepted!",
								embed: embed
							});
						}
					} catch(e) {
						console.log(e);
						message.channel.createMessage("Notification for this request couldn't be updated");
					}

					try {
						await this.delete(message.guild.id, message.channel.id, message.id);
						await channel.createMessage({embed: {
							title: "Request acceptance",
							description: `Your edit request for ${request.data.name} (${request.server_id}) has been accepted!`,
							color: parseInt('55aa55', 16),
							timestamp: new Date().toISOString()
						}});
						var guild = await this.bot.stores.servers.update(message.guild.id, request.server_id, request.data);
						await this.bot.stores.serverPosts.updateByHostedServer(message.guild.id, guild.server_id, guild);
					} catch(e) {
						console.log(e);
						await message.channel.createMessage("ERR: "+(e.message || e));
						return rej(e.message || e);
					}
					break;
				case "❌":
					try {
						if(embed) {
							embed.author = {
								name: `Denied by: ${member.username}#${member.discriminator} (${member.id})`,
								icon_url: member.avatarURL
							}
							await this.bot.editMessage(message.channel.id, message.id, {
								content: "Edit request denied",
								embed: embed
							});
						}

						var reason;
						await message.channel.createMessage("Please enter a denial reason. Type `cancel` to cancel the denial, or `skip` to skip giving a reason");
						var response = (await channel.awaitMessages(m => m.author.id == user.id, {time:1000*60*3, maxMatches: 1, }))[0].content;
						if(response == "cancel") {
							await channel.createMessage("Action cancelled");
							return res;
						} else if(response.toLowerCase() != "skip") reason = response;
					} catch(e) {
						console.log(e);
						message.channel.createMessage("Notification for this request couldn't be updated");
					}

					try {
						await this.delete(message.guild.id, message.channel.id, message.id);
						await channel.createMessage({embed: {
							title: "Request denial",
							description: `Your edit request for ${request.data.name} (${request.server_id}) has been denied. ${reason ? "Reason: "+reason : "No reason was given"}`,
							color: parseInt('aa5555', 16),
							timestamp: new Date().toISOString()
						}});
					} catch(e) {
						console.log(e);
						await message.channel.createMessage("ERR: "+(e.message || e));
						return rej(e.message || e);
					}
					break;
			}
			res();
		})
	}
}

module.exports = (bot, db) => new EditRequestStore(bot, db);