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
				this.handleReactions(...args, this)
			} catch(e) {
				console.log(e);
			}
		})
	}

	async create(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO posts (
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

	async get(server, message, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var post = super.get(`${server}-${message}`);
				if(post) return res(post);
			}

			try {
				var data = await this.db.query(`SELECT * FROM posts WHERE host_id = $1 AND message_id = $2`,[server, message]);
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
				var data = await this.db.query(`SELECT * FROM posts WHERE host_id = $1`,[server]);
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
				var post = await this.get(server, message);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			if(!post) return rej("Post not found");

			try {
				await this.db.query(`DELETE FROM posts WHERE server_id = $1 AND message_id = $2`, [server, message]);
				super.delete(`${server}-${message}`);
				await this.bot.deleteMessage(post.channel_id, post.message_id);
			} catch(e) {
				console.log(e);
				if(e.message && !e.message.toLowerCase().contains("unknown message")) return rej(e.message);
				else if(!e.message) return rej(e);
			}

			res();
		})
	}

	async handleReactions(msg, emoji, user, store) {
		return new Promise(async (res, rej) => {
			try {
				msg = store.bot.getMessage(msg.channel.id, msg.id);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(!msg.guild) return res();

			var tpost = await store.get(bot, msg.channel.guild.id, msg.id);
			if(!tpost) return res();
			try {
				await bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name, user);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			var ch = await bot.getDMChannel(user);
			var tickets = await store.bot.stores.tickets.getByUser(msg.channel.guild.id, user);
			if(tickets && tickets.length >= 5) {
				try {
					return ch.createMessage("Couldn't open ticket: you already have 5 open for that server")
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
			}

			var us = await store.bot.utils.fetchUser(bot, user);
			var ticket = await store.bot.stores.tickets.create(msg.channel.guild.id, us);
			if(!ticket.hid) {
				try {
					ch.createMessage("Couldn't open your support ticket:\n"+ticket.e);
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}	
			}
			res(a);
		});
	}
}

module.exports = (bot, db) => new TicketPostStore(bot, db);