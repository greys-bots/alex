module.exports = {
	getServers: async (bot, host) => {
		return new Promise((res)=>{
			bot.db.query(`SELECT * FROM servers WHERE host_id=?`,[host], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				visibility: Boolean
			}, (err,rows)=>{
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					if(!rows[0]) return res(undefined);

					for(var i = 0; i < rows.length; i++) {
						rows[i].guild = bot.guilds.find(g => g.id == rows[i].server_id);
					}
					res(rows);
				}
			})
		})
	},
	getServer: async (bot, host, id) => {
		return new Promise((res)=>{
			bot.db.query(`SELECT * FROM servers WHERE host_id=? AND server_id=?`,[host, id], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				visibility: Boolean
			}, (err,rows)=>{
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					if(!rows[0]) return res(undefined);

					rows[0].guild = bot.guilds.find(g => g.id == id);
					res(rows[0]);
				}
			})
		})
	},
	getServerByID: async (bot, id) => {
		return new Promise((res)=>{
			bot.db.query(`SELECT * FROM servers WHERE server_id=?`,[id], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				visibility: Boolean
			}, (err,rows)=>{
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					if(!rows[0]) return res(undefined);

					rows[0].guild = bot.guilds.find(g => g.id == rows[0].server_id);
					res(rows[0]);
				}
			})
		})
	},
	getServerByRowID: async (bot, id) => {
		return new Promise((res)=>{
			bot.db.query(`SELECT * FROM servers WHERE id=?`,[id], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				visibility: Boolean
			}, (err,rows)=>{
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					rows[0].guild = bot.guilds.find(g => g.id == rows[0].server_id);
					res(rows[0]);
				}
			})
		})
	},
	getServersWithContact: async (bot, host, id) => {
		return new Promise((res)=>{
			bot.db.query(`SELECT * FROM servers WHERE host_id=? AND contact_id LIKE ?`,[host, "%"+id+"%"], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				visibility: Boolean
			}, (err,rows)=>{
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					if(!rows[0]) return res(undefined);

					rows[0].guild = bot.guilds.find(g => g.id == rows[0].server_id);
					res(rows);
				}
			})
		})
	},
	addServer: async (bot, host, server, name, invite, image) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO servers (host_id, server_id, name, invite, pic_url) VALUES (?,?,?,?,?)`, [host, server, name, invite, image], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			});
		})
	},
	updateHostedServer: async (bot, host, id, data)=> {
		return new Promise(res=>{
			bot.db.query(`UPDATE servers SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE host_id = ? AND server_id=?`, [...Object.values(data), host, id], (err, rows)=>{
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			});
		})
	},
	updateServer: async (bot, id, data)=> {
		return new Promise(res=>{
			bot.db.query(`UPDATE servers SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=?`, [...Object.values(data), id], (err, rows)=>{
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			});
		})
	},
	deleteServer: async (bot, host, id) => {
		return new Promise(res => {
			bot.db.query('DELETE FROM servers WHERE id=?',[id],(err,rows)=>{
				if(err) {
					cosole.log(err);
					res(false)
				} else {
					bot.db.query('DELETE FROM posts WHERE host_id=? AND server_id=?',[host, id],(err,rows)=>{
						if(err) {
							cosole.log(err);
							res(false)
						} else {
							res(true)
						}
					})
				}
			})
		})
	},
	deleteServers: async (bot, host) => {
		return new Promise(res => {
			bot.db.query('DELETE FROM servers WHERE host = ?',[host], async (err,rows)=>{
				if(err) {
					cosole.log(err);
					res(false)
				} else {
					var scc = await bot.utils.deleteAllPosts(bot, host);
					res(scc)
				}
			})
		})
	},
	findServers: async (bot, host, name) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM servers WHERE host_id=? AND (name LIKE ? OR id = ?)`,[host, "%"+query+"%", query], {
				id: Number,
				host_id: String,
				server_id: String,
				contact_id: String,
				name: String,
				description: String,
				invite: String,
				pic_url: String,
				visibility: Boolean
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(!rows[0]) return res(undefined);

					for(var i = 0; i < rows.length; i++) {
						rows[i].guild = bot.guilds.find(g => g.id == rows[i].server_id);
					}
					res(rows);
				}
			})
		})
	},

	//server posts
	getAllPosts: async (bot, host) => {
		return new Promise(async res => {
			var posts = [];
			bot.db.query(`SELECT * FROM posts WHERE host_id=?`,[host], async (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					for(var i = 0; i < rows.length; i++) {
						var s = await bot.utils.getServerByRowID(bot, rows[i].server_id);
						if(s) posts.push({server_id: s.server_id, name: s.name, channel_id: rows[i].channel_id, message_id: rows[i].message_id});
						else  posts.push({server_id: rows[i].server_id, channel_id: rows[i].channel_id, message_id: rows[i].message_id});
					}

					res(posts);
				}
			});

		})
	},
	getPosts: async (bot, host, id, chanid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM posts WHERE host_id=? AND server_id=? AND channel_id=?`,[host, id, chanid], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(rows);
				}
			})
		})
	},
	getPostsByServer: async (bot, id) => {
		return new Promise(async res => {
			var guild = await bot.utils.getServerByID(bot, id);
			if(!guild) return res(undefined);
			bot.db.query(`SELECT * FROM posts WHERE server_id = ?`,[guild.id], (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	updatePosts: async (bot, host, id) => {
		return new Promise(async res=> {
			var guild = await bot.utils.getServer(bot, host, id)
			if(!guild) {
				console.log('Guild not found')
				res(false);
				return;
			}
			var posts = await bot.utils.getPostsByServer(bot, id);
			if(!posts || !posts[0]) res(true);
			var dat = guild.contact_id == undefined || guild.contact_id == "" ? "" : await bot.utils.verifyUsers(bot, guild.contact_id.split(" "));
			var contacts = dat.info ? dat.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n") : "(no contact provided)";
			for(var i = 0; i < posts.length; i++) {
				try {
					await bot.editMessage(posts[i].channel_id, posts[i].message_id, {embed: {
						title: guild.name || "(unnamed)",
						description: guild.description || "(no description provided)",
						fields: [
							{name: "Contact", value: contacts},
							{name: "Link", value: guild.invite ? guild.invite : "(no link provided)", inline: true},
							{name: "Members", value: bot.guilds.find(g => g.id == guild.server_id) ? bot.guilds.find(g => g.id == guild.server_id).memberCount : "(unavailable)"}
						],
						thumbnail: {
							url: guild.pic_url || ""
						},
						color: 3447003,
						footer: {
							text: `ID: ${guild.server_id}`
						}
					}})
				} catch(e) {
					console.log(e);
					if(e.message.includes("Unknown Message")) await bot.utils.deletePost(bot, host, posts[i].message_id);
				}
				
			}
			res(true);
		})
	},
	updatePostsByServer: async (bot, id) => {
		return new Promise(async res=> {
			var guild = await bot.utils.getServerByID(bot, id)
			if(!guild) {
				console.log('Guild not found')
				res(false);
				return;
			}
			var posts = await bot.utils.getPostsByServer(bot, id);
			if(!posts || !posts[0]) res(true);
			var dat = guild.contact_id == undefined || guild.contact_id == "" ? "" : await bot.utils.verifyUsers(bot, guild.contact_id.split(" "));
			var contacts = dat.info ? dat.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n") : "(no contact provided)";
			for(var i = 0; i < posts.length; i++) {
				try {
					await bot.editMessage(posts[i].channel_id, posts[i].message_id, {embed: {
						title: guild.name || "(unnamed)",
						description: guild.description || "(no description provided)",
						fields: [
							{name: "Contact", value: contacts},
							{name: "Link", value: guild.invite ? guild.invite : "(no link provided)", inline: true},
							{name: "Members", value: bot.guilds.find(g => g.id == guild.server_id) ? bot.guilds.find(g => g.id == guild.server_id).memberCount : "(unavailable)"}
						],
						thumbnail: {
							url: guild.pic_url || ""
						},
						color: 3447003,
						footer: {
							text: `ID: ${guild.server_id}`
						}
					}})
				} catch(e) {
					console.log(e);
					if(e.message.includes("Unknown Message")) await bot.utils.deletePost(bot, posts[i].host_id, posts[i].message_id);
				}
				
			}
			res(true);
		})
	},
	deleteAllPosts: async (bot, host) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM posts WHERE host_id=?`,[host], async (err, rows)=>{
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	deletePosts: async (bot, host, id) => {
		return new Promise(async res=> {
			var guild = await bot.utils.getServer(bot, host, id)
			if(!guild) {
				console.log('Guild not found')
				res(false);
			}
			bot.db.query(`SELECT * FROM posts WHERE host_id=? AND server_id=?`,[host, guild.id], async (err, rows)=>{
				if(err) {
					console.log(err);
					res(false);
				} else {
					for(var i = 0; i < rows.length; i++) {
						try {
							await bot.deleteMessage(rows[i].channel_id, rows[i].message_id)
						} catch(e) {
							console.log(e);
							return res(false);
						}
					}

					res(true);
				}
			})
		})
	},
	deletePost: async (bot, host, id) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM posts WHERE host_id = ? AND message_id=?`,[host, id],(err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	}
}