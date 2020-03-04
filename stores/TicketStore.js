const {Collection} = require("discord.js");

class TicketStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, data) {
		return new Promise(async (res, rej) => {
			var cfg = await this.bot.stores.ticketConfigs.get(server);
			if(!cfg) return rej("No config registered; please run `ha!ticket config setup` first");
			var hid = this.bot.utils.genCode(this.bot.chars);
			var time = new Date().toISOString();
			try {
				var channel = await this.bot.createChannel(server, `ticket-${hid}`, 0, "", {
					topic: `Ticket ${hid}`,
					parentID: cfg.category_id
				})
				channel.editPermission(data.opener.id, 1024, 0, "member");
			} catch(e) {
				console.log(e);
				return res({e: "Couldn't create and/or channel; please make sure I have permission and there are channel slots left"});
			}

			try {
				var message = await this.bot.createMessage(channel.id, {
					content: `Thank you for opening a ticket, ${data.opener.mention}! You can chat with support staff here.`,
					embed: {
						title: "Ticket opened!",
						fields: [
							{name: "Ticket Opener", value: data.opener.mention},
							{name: "Ticket Users", value: data.opener.mention}
						],
						color: 2074412,
						footer: {
							text: "Ticket ID: "+hid
						},
						timestamp: time
					}
				})

				await this.db.query(`INSERT INTO tickets (
					hid,
					server_id,
					channel_id,
					first_message,
					opener,
					users,
					timestamp
				) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
				[hid, server, data.channel_id, data.first_message,
				data.opener, data.users || [], data.timestamp || new Date().toISOString()]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(server, hid));
		})
	}

	async get(server, hid, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var ticket = super.get(`${server}-${hid}`);
				if(ticket) return res(ticket);
			}

			try {
				var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1 AND hid = $2`,[server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				this.set(`${server}-${hid}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByUser(server, user) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1 AND opener_id = $2`,[server, user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {		
			try {
				var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	//a surprise tool that'll help us later
	// async search(server, query = {}) {
	// 	return new Promise(async (res, rej) => {
	// 		var tickets;
	// 		try {
	// 			if(query.opener_id) tickets = await this.getByUser(server, query.sender_id);
	// 			else tickets = await this.getAll(server);
	// 		} catch(e) {
	// 			return rej(e)
	// 		}

	// 		if(query.description) tickets.filter(t => t.description.toLowerCase().includes(query.description));

	// 		if(tickets[0]) res(tickets);
	// 		else res(undefined);
	// 	})
	// }

	async update(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE tickets SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND hid = $2`,[server, hid, ...Object.values(data)]);
				var ticket = await this.get(server, hid, true);
				await this.bot.editMessage(ticket.channel_id, ticket.first_message, {
					embed: {
						title: "Ticket opened!",
						fields: [
							{name: "Ticket Opener", value: `<@${ticket.opener_id}>`},
							{name: "Ticket Users", value: ticket.users.map(u => `<@${u}>`)}
						],
						color: 2074412,
						footer: {
							text: "Ticket ID: "+ticket.hid
						},
						timestamp: ticket.timestamp
					}
				})
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}
			
			res(await this.get(server, hid, true));
		})
	}

	async delete(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM tickets WHERE server_id = $1 AND hid = $2`, [server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${hid}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var tickets = await this.getAll(server);
				await this.db.query(`DELETE FROM tickets WHERE server_id = $1`, [server]);
				for(var ticket of tickets) super.delete(`${server}-${ticket.hid}`);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new TicketStore(bot, db);