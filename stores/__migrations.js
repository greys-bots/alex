require('dotenv').config();

var dblite 	= require('dblite');
var fs 		= require('fs');
var Eris 	= require("eris-additions")(require("eris"));
var bot 	= new Eris(process.env.TOKEN, {restmode: true});

const old_db = dblite('data.sqlite', '-header');

async function migrate() {
	return new Promise(async (res, rej)=> {
		const db = await require(__dirname+'/__db')(bot);

		await db.query(`BEGIN TRANSACTION`);
		old_db.query(`SELECT * FROM ban_logs`, {
			id: Number,
			hid: String,
			server_id: String,
			channel_id: String,
			message_id: String,
			users: val => val ? JSON.parse(val) : null,
			reason: String,
			timestamp: Date
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.banLogs.index(row.server_id, row.hid, row);
				}
			}
		});

		old_db.query(`SELECT * FROM configs`, {
			id: Number,
			server_id: String,
			banlog_channel: String,
			ban_message: String,
			reprole: String,
			delist_channel: String,
			starboard: val => val ? JSON.parse(val) : null,
			blacklist: val => val ? JSON.parse(val) : null,
			feedback: val => val ? JSON.parse(val) : null,
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					if(row.starboard && row.starboard.board) {
						for(var board of row.starboard.boards) {
							var tolerance = board.tolerance || row.starboard.tolerance;
							bot.stores.starboards.index(row.server_id, board.channel, board.emoji, board);
						}
					}
					if(row.feedback) bot.stores.feedbackConfigs.index(row.server_id, row.feedback);

					//starboard key now dictates global tolerance
					row.starboard = row.starboard ? row.starboard.tolerance : null;
					await bot.stores.configs.index(row.server_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM commands`, {
			id: Number,
			server_id: String,
			name: String,
			actions: val => val ? JSON.parse(val) : null,
			target: String,
			del: Boolean
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.customCommands.index(row.server_id, row.name, row);
				}
			}
		})

		old_db.query(`SELECT * FROM feedback`, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.feedbackTickets.index(row.hid, row.server_id, row.sender_id, row.message, row.anon);
				}
			}
		})

		old_db.query(`SELECT * FROM listing_logs`, {
			id: Number,
			hid: String,
			server_id: String,
			channel_id: String,
			message_id: String,
			server_name: String,
			reason: String,
			timestamp: Date,
			type: Number
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.listingLogs.index(row.server_id, row.hid, row);
				}
			}
		})

		old_db.query(`SELECT * FROM reactcategories`, {
			id: Number,
			hid: String,
			server_id: String,
			name: String,
			description: String,
			roles: val => val ? JSON.parse(val) : null,
			posts: val => val ? JSON.parse(val) : null
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.reactCategories.index(row.server_id, row.hid, row);
				}
			}
		})

		old_db.query(`SELECT * FROM reactposts`, {
			id: Number,
			server_id: String,
			channel_id: String,
			message_id: String,
			roles: val => val ? JSON.parse(val) : null,
			page: Number
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.reactPosts.index(row.server_id, row.channel_id, row.message_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM reactroles`, {
			id: Number,
			server_id: String,
			role_id: String,
			emoji: String,
			description: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.reactRoles.index(row.server_id, row.role_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM receipts`, {
			id: Number,
			hid: String,
			server_id: String,
			message: String,
			link: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.receipts.index(row.server_id, row.hid, row);
				}
			}
		})

		old_db.query(`SELECT * FROM servers`, {
			id: Number,
			host_id: String,
			server_id: String,
			contact_id: val => val ? val.split(" ") : null,
			name: String,
			description: String,
			invite: String,
			pic_url: String,
			visibility: Boolean
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row);
					await bot.stores.servers.index(row.host_id, row.server_id, row);
					old_db.query(`SELECT * FROM posts WHERE server_id = ?`, [row.id], {
						id: Number,
						host_id: String,
						server_id: String,
						channel_id: String,
						message_id: String
					}, async (err, rows2) => {
						if(err) {
							console.log(err);
							rej(err.message);
						} else if(rows[0]) {
							for(var row2 of rows2) {
								console.log(row2);
								await bot.stores.serverPosts.index(row2.host_id, row.server_id, row2.channel_id, row2.message_id);
							}
						}
					})
				}
			}
		});

		old_db.query(`SELECT * FROM starboards`, {
			id: Number,
			server_id: String,
			channel_id: String,
			emoji: String,
			override: Boolean,
			tolerance: Number
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.starboards.index(row.server_id, row.channel_id, row.emoji, row);
				}
			}
		});

		old_db.query(`SELECT * FROM starred_messages`, {
			id: Number,
			server_id: String,
			channel_id: String,
			message_id: String,
			emoji: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.starPosts.index(row.server_id, row.channel_id, row.message_id, row);
				}
			}
		});

		old_db.query(`SELECT * FROM sync`, {
			id: Number,
			server_id: String,
			sync_id: String,
			confirmed: Boolean,
			syncable: Boolean,
			sync_notifs: String,
			ban_notifs: String,
			enabled: Boolean
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.syncConfigs.index(row.server_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM sync_menus`, {
			id: Number,
			server_id: String,
			channel_id: String,
			message_id: String,
			type: Number,
			reply_guild: String,
			reply_channel: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.syncMenus.index(row.server_id, row.channel_id, row.message_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM ticket_configs`, {
			id: Number,
			server_id: String,
			category_id: String,
			archives_id: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.ticketConfigs.index(row.server_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM ticket_posts`, {
			id: Number,
			server_id: String,
			channel_id: String,
			message_id: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.ticketPosts.index(row.server_id, row.channel_id, row.message_id);
				}
			}
		})

		old_db.query(`SELECT * FROM tickets`, {
			id: Number,
			hid: String,
			server_id: String,
			channel_id: String,
			first_message: String,
			opener: String,
			users: val => val ? JSON.parse(val) : null,
			timestamp: Date
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.tickets.index(row.server_id, row.hid, row);
				}
			}
		})

		await db.query(`COMMIT`);
	})
}

migrate();