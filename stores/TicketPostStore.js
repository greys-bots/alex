const {Collection} = require("discord.js");

class TicketPostStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on("messageReactionAdd", (...args) => {
			try {
				this.handleReactions(...args)
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageDelete", async (msg) => {
			return new Promise(async (res, rej) => {
				if(msg.channel.type == 1) return;

				try {
					var ticket = await this.get(msg.channel.guild.id, msg.id);
					if(!ticket) return;
					await this.delete(ticket.server_id, ticket.message_id);
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
				await this.db.query(`INSERT INTO ticket_posts (
					server_id,
					channel_id,
					message_id
				) VALUES ($1,$2,$3)`,
				[server, channel, message]);
			} catch(e) {
				console.log(e);
	 			return rej(e.message);
			}
			
			res(await this.get(server, message));
		})
	}

	async index(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO ticket_posts (
					server_id,
					channel_id,
					message_id
				) VALUES ($1,$2,$3)`,
				[server, channel, message]);
			} catch(e) {
				console.log(e);
	 			return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, message, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var post = super.get(`${server}-${message}`);
				if(post) return res(post);
			}

			try {
				var data = await this.db.query(`SELECT * FROM ticket_posts WHERE server_id = $1 AND message_id = $2`,[server, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				this.set(`${server}-${message}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM ticket_posts WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows);
			} else res(undefined);
		})
	}

	async update(server, message, data = {}) {
		return new Promise(async (res, rej) => {
			//nothing needed at the moment
			res();
		})
	}

	async delete(server, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM ticket_posts WHERE server_id = $1 AND message_id = $2`, [server, message]);
				super.delete(`${server}-${message}`);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			res();
		})
	}

	async handleReactions(msg, emoji, user) {
		return new Promise(async (res, rej) => {
			if(this.bot.user.id == user.id) return;
			if(!msg.channel.guild) return;
			var tpost = await this.get(msg.channel.guild.id, msg.id);
			if(!tpost) return res();

			try {
				msg = await this.bot.getMessage(msg.channel.id, msg.id);
				await this.bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name, user.id);
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}
			
			var ch = await this.bot.getDMChannel(user.id);
			var tickets = await this.bot.stores.tickets.getByUser(msg.channel.guild.id, user.id);
			if(tickets && tickets.length >= 5) {
				try {
					return ch.createMessage("Couldn't open ticket: you already have 5 open for that server")
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
			}
		
			var ticket = await this.bot.stores.tickets.create(msg.channel.guild.id, {opener: user});
			if(!ticket.hid) {
				try {
					ch.createMessage("Couldn't open your support ticket:\n"+ticket.e);
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}	
			}
			res();
		});
	}
}

module.exports = (bot, db) => new TicketPostStore(bot, db);