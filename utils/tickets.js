module.exports = {
	getSupportConfig: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ticket_configs WHERE server_id=?`,[server],{
				id: Number,
				server_id: String,
				category_id: String,
				archives_id: String
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	createSupportConfig: async (bot, server, category, archives) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO ticket_configs (server_id, category_id, archives_id) VALUES (?,?,?)`,[server, category, archives], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	},
	updateSupportConfig: async (bot, server, key, val) => {
		return new Promise(res => {
			if(val) {
				bot.db.query(`UPDATE ticket_configs SET ?=? WHERE server_id=?`,[key, val, server], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(true)
					}
				})
			} else {
				console.log(`UPDATE ticket_configs SET ${key.map((k,i) => (i%2 == 0 ? "?=?" : null)).filter(x => x!=null).join(",")} WHERE server_id=?`)
				bot.db.query(`UPDATE ticket_configs SET ${key.map((k,i) => (i%2 == 0 ? "?=?" : null)).filter(x => x!=null).join(",")} WHERE server_id=?`,[...key, server], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(true)
					}
				})
			}
		})
	},
	deleteSupportConfig: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM ticket_configs WHERE server_id = ?`,[server], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	},
	getSupportTickets: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM tickets WHERE server_id=?`,[server],{
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				first_message: String,
				opener: String,
				users: JSON.parse,
				timestamp: String
			}, async (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					var tickets = rows;
					if(!tickets[0]) return res(undefined);

					await bot.asyncForEach(tickets, bot, null, null, async (bot, msg, args, ticket, ind) => {
						var users = [];
						for(var i = 0; i < ticket.users.length; i++) {
							var us = await bot.utils.fetchUser(bot, ticket.users[i]);
							users.push(us);
						}

						tickets[ind].userids = tickets[ind].users;
						tickets[ind].users = users;
						var opener = await bot.utils.fetchUser(bot, ticket.opener);
						tickets[ind].opener = opener;
					})

					res(tickets);
				}
			})
		})
	},
	getSupportTicketsByUser: async (bot, server, user) => {
		return new Promise(async res => {
			var tickets = await bot.utils.getSupportTickets(bot, server); //so all the user info is there
			if(!tickets) return res(undefined);
			tickets = tickets.filter(t => t.opener.id == user);
			if(!tickets[0]) res(undefined);
			else res(tickets);
		})
	},
	getSupportTicket: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM tickets WHERE server_id=? AND hid=?`,[server, hid],{
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				first_message: String,
				opener: String,
				users: JSON.parse,
				timestamp: String
			}, async (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					var ticket = rows[0];
					if(!ticket) return res(undefined);

					var users = [];
					for(var i = 0; i < ticket.users.length; i++) {
						var us = await bot.utils.fetchUser(bot, ticket.users[i]);
						users.push(us);
					}
					ticket.userids = ticket.users;
					ticket.users = users;
					var opener = await bot.utils.fetchUser(bot, ticket.opener);
					ticket.opener = opener;

					res(ticket);
				}
			})
		})
	},
	getSupportTicketByChannel: async (bot, server, channel) => {
		return new Promise(async res => {
			var tickets = await bot.utils.getSupportTickets(bot, server);
			if(!tickets) return res(undefined);
			var ticket = tickets.find(t => t.channel_id == channel);
			res(ticket);
		})
	},
	createSupportTicket: async (bot, server, user) => {
		return new Promise(async res => {
			var cfg = await bot.utils.getSupportConfig(bot, server);
			if(!cfg) return res({err: "No config registered; please run `hub!ticket config setup` first"});
			var code = bot.utils.genCode(bot.chars);
			var time = new Date();
			try {
				var channel = await bot.createChannel(server, `ticket-${code}`, 0, "", {
					topic: `Ticket ${code}`,
					parentID: cfg.category_id
				})
				channel.editPermission(user.id, 1024, 0, "member");
			} catch(e) {
				console.log(e);
				return res({err: "Couldn't create and/or channel; please make sure I have permission and there are channel slots left"});
			}

			try {
				var message = await bot.createMessage(channel.id, {
					content: `Thank you for opening a ticket, ${user.mention}! You can chat with support staff here.`,
					embed: {
						title: "Ticket opened!",
						fields: [
							{name: "Ticket Opener", value: user.mention},
							{name: "Ticket Users", value: user.mention}
						],
						color: 2074412,
						footer: {
							text: "Ticket ID: "+code
						},
						timestamp: time
					}
				})
			} catch(e) {
				console.log(e);
				return res({err: "Could not send message; please make sure I have permission"})
			}

			var scc = await bot.utils.addSupportTicket(bot, code, server, channel.id, message.id, user.id, [user.id], time.toISOString());
			if(scc) res({hid: code});
			else res({err: "Couldn't insert data"})
		})
	},
	addSupportTicket: async (bot, hid, server, channel, message, opener, users, timestamp) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO tickets (hid, server_id, channel_id, first_message, opener, users, timestamp) VALUES (?,?,?,?,?,?,?)`,[hid, server, channel, message, opener, users, timestamp], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true);
				}
			})
		})
	},
	deleteSupportTicket: async (bot, server, channel) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM tickets WHERE server_id = ? AND channel_id = ?`,[server, channel], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			})
		})
	},
	deleteSupportTickets: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM tickets WHERE server_id = ?`,[server], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			})
		})
	},
	editSupportTicket: async (bot, server, ticket, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE tickets SET ?=? WHERE server_id = ? AND hid = ?`,[key, val, server, ticket], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	addTicketPost: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO ticket_posts (server_id, channel_id, message_id) VALUES (?,?,?)`,[server, channel, message], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			})
		})
	},
	getTicketPosts: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ticket_posts WHERE server_id = ?`,[server],{
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows)
				}
			})
		})
	},
	getTicketPost: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ticket_posts WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[server, channel, message],{
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	deleteTicketPost: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM ticket_posts WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[server, channel, message], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deleteTicketPosts: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM ticket_posts WHERE server_id = ?`,[server], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	}
}