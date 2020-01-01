module.exports = {
	//general utils
	genEmbeds: async (bot, arr, genFunc, info = {}, fieldnum) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: info.title,
				description: info.description,
				fields: []
			}};
			
			for(let i=0; i<arr.length; i++) {
				if(current.embed.fields.length < (fieldnum || 10)) {
					current.embed.fields.push(await genFunc(arr[i], bot));
				} else {
					embeds.push(current);
					current = { embed: {
						title: info.title,
						description: info.description,
						fields: [await genFunc(arr[i], bot)]
					}};
				}
			}
			embeds.push(current);
			if(embeds.length > 1) {
				for(let i = 0; i < embeds.length; i++)
					embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${arr.length} total)`;
			}
			res(embeds);
		})
	},
	genReactPosts: async (bot, roles, msg, info = {}) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: info.title,
				description: info.description,
				fields: []
			}, roles: [], emoji: []};
			
			for(let i=0; i<roles.length; i++) {
				if(current.embed.fields.length < 10) {
					var rl = msg.guild.roles.find(x => x.id == roles[i].role_id);
					if(rl) {
					 	current.embed.fields.push({name: `${rl.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`, value: roles[i].description || "*(no description provided)*"});
					 	current.roles.push({role_id: roles[i].role_id, emoji: roles[i].emoji});
					 	current.emoji.push(roles[i].emoji);
					}
				} else {
					embeds.push(current);
					current = { embed: {
						title: info.title,
						description: info.description,
						fields: []
					}, roles: [], emoji: []};
					var rl = msg.guild.roles.find(x => x.id == roles[i].role_id);
					if(rl) {
					 	current.embed.fields.push({name: `${rl.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`, value: roles[i].description || "*(no description provided)*"});
					 	current.roles.push({role_id: roles[i].role_id, emoji: roles[i].emoji});
					 	current.emoji.push(roles[i].emoji);
					}
				}
			}
			embeds.push(current);
			if(embeds.length > 1) {
				for(let i = 0; i < embeds.length; i++)
					embeds[i].embed.title += ` (part ${i+1}/${embeds.length})`;
			}
			res(embeds);
		})
	},
	genCode: (table, num = 4) =>{
		var codestring="";
		var codenum=0;
		while (codenum<num){
			codestring=codestring+table[Math.floor(Math.random() * (table.length))];
			codenum=codenum+1;
		}
		return codestring;
	},
	verifyUsers: async (bot, ids) => {
		return new Promise(async res=>{
			var results = {
				pass: [],
				fail: [],
				info: []
			};

			for(var i = 0; i < ids.length; i++) {
				try {
					var user = bot.users.find(u => u.id == ids[i]) || await bot.getRESTUser(ids[i]);
					if(user) {
						results.pass.push(ids[i]);
						results.info.push(user);
					}
				} catch(e) {
					results.fail.push(ids[i]);
				}
			}
			res(results);
		})
	},
	paginateEmbeds: async function(bot, m, emoji) {
		switch(emoji.name) {
			case "\u2b05":
				if(this.index == 0) {
					this.index = this.data.length-1;
				} else {
					this.index -= 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
				await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, this.user)
				bot.menus[m.id] = this;
				break;
			case "\u27a1":
				if(this.index == this.data.length-1) {
					this.index = 0;
				} else {
					this.index += 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
				await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, this.user)
				bot.menus[m.id] = this;
				break;
			case "\u23f9":
				await bot.deleteMessage(m.channel.id, m.id);
				delete bot.menus[m.id];
				break;
		}
	},

	//config
	getConfig: async (bot, id)=> {
		return new Promise(res=>{
			bot.db.query(`SELECT * FROM configs WHERE server_id=?`,[id], {
				id: Number,
		        server_id: String,
		        banlog_channel: String,
		        ban_message: String,
		        reprole: String,
		        delist_channel: String,
		        starboard: val => val ? JSON.parse(val) : null,
		        blacklist: val => val ? JSON.parse(val) : null,
		        feedback: val => val ? JSON.parse(val) : null
			}, (err,rows)=>{
				if(err) {
					console.log("config err")
					console.log(err);
					res(false);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	updateConfig: async function(bot, srv, data) {
		return new Promise((res)=> {
			bot.db.query(`SELECT * FROM configs WHERE server_id=?`,[srv], (err, rows)=> {
				if(err) {
					console.log(err);
				} else {
					if(!rows[0]) {
						bot.db.query(`INSERT INTO configs 
									 (server_id, banlog_channel, ban_message, reprole, delist_channel, starboard, blacklist, feedback) VALUES 
									 (?,?,?,?,?,?,?,?,?,?,?)`,
									 [srv, data.banlog_channel || "", data.ban_message || "", data.reprole || "", data.delist_channel || "",
									 data.starboard || {}, data.blacklist || [], data.feedback || {}])
					} else {
						bot.db.query(`UPDATE configs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=?`,[...Object.values(data), srv], (err, rows)=> {
							if(err) {
								console.log(err);
								res(false)
							} else {
								res(true)
							}
						})
					}					
				}
			})
		})
	},
	deleteConfig: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM configs WHERE server_id = ?`, [id], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},

	//servers
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
			bot.db.query(`SELECT * FROM servers WHERE host_id=? AND name LIKE ?`,[host, "%"+name+"%"], {
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
	},

	//commands
	getCustomCommands: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM commands WHERE server_id=?`,[id],
				{
					id: Number,
					server_id: String,
					name: String,
					actions: JSON.parse,
					target: String,
					del: Number
				}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	getCustomCommand: async (bot, id, name) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM commands WHERE server_id=? AND name=?`,[id, name],
				{
					id: Number,
					server_id: String,
					name: String,
					actions: JSON.parse,
					target: String,
					del: Number
				}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	addCustomCommand: async (bot, server, name, actions, target, del) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO commands (server_id, name, actions, target, del) VALUES (?,?,?,?,?)`,[server, name, actions, target, del], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteCustomCommand: async (bot, server, name) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM commands WHERE server_id=? AND name=?`,[server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteCustomCommands: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM commands WHERE server_id=?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},

	//reactio roles
	getReactionRoles: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactroles WHERE server_id=?`,[id],(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	getReactionRolesByCategory: async (bot, serverid, categoryid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=? AND hid=?`,[serverid, categoryid], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse
			}, async (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0].roles) {
						var roles = [];
						for(var i = 0; i < rows[0].roles.length; i++) {
							bot.db.query(`SELECT * FROM reactroles WHERE id=?`,[rows[0].roles[i]], (err, rls)=> {
								roles[i] = rls[0]
							});
						}

						res(roles);
					} else {
						res(undefined);
					}

				}
			})
		})
	},
	getReactionRoleByReaction: async (bot, id, emoji, postid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactroles WHERE server_id=? AND emoji=? AND post_id=?`,[id, emoji, postid],(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	getReactionRole: async (bot, id, role) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactroles WHERE server_id=? AND role_id=?`,[id, role],(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	deleteReactionRoles: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`DELETE * FROM reactroles WHERE server_id = ?`, [id], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	},

	//reaction categories
	getReactionCategories: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=?`,[id], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	getReactionCategory: async (bot, id, categoryid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=? AND hid=?`,[id, categoryid], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse,
				posts: JSON.parse
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	updateReactCategoryPosts: async (bot, id, msg, categoryid) => {
		return new Promise(async res => {
			var cat = await bot.utils.getReactionCategory(bot, id, categoryid);
			if(!cat) return res(false);
			if(!cat.posts || !cat.posts[0]) return res(true);
			var roles = await bot.utils.getReactionRolesByCategory(bot, msg.guild.id, cat.hid);
			if(!roles) return res(false);
			if(roles.length == 0) {
				for(var i = 0; i < cat.posts.length; i++) {
					var pst = await bot.utils.getReactionRolePost(bot, id, cat.posts[i]);
					var message;
					if(!pst) continue;
					try {
						message = await bot.getMessage(pst.channel_id, pst.message_id);
					} catch(e) {
						console.log(e);
						continue;
					}

					await message.delete();
					bot.db.query(`DELETE FROM reactposts WHERE server_id = ? AND message_id=?`, [
						message.guild.id,
						message.id
					], (err, rows)=> {
						if(err) console.log(err);
					})
				}

			} else if(roles.length <= 10) {
				for(var i = 0; i < cat.posts.length; i++) {
					var pst = await bot.utils.getReactionRolePost(bot, id, cat.posts[i]);
					if(!pst) continue;
					var message;
					try {
						message = await bot.getMessage(pst.channel_id, pst.message_id);
					} catch(e) {
						console.log(e);
						continue;
					}
					
					if(pst.page > 0) return await message.delete();

					await bot.editMessage(message.channel.id, message.id, {embed: {
						title: cat.name,
						description: cat.description,
						fields: roles.map(r => {
							var rl = msg.guild.roles.find(x => x.id == r.role_id);
							return {name: `${rl.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`, value: r.description || "*(no description provided)*"}
						})
					}})

					var emoji = roles.map(r => r.emoji);
					message.removeReactions();
					emoji.forEach(rc => message.addReaction(rc));

					bot.db.query(`UPDATE reactposts SET roles = ?, page=? WHERE server_id = ? AND message_id=?`,[
						roles.map(r => {return {emoji: r.emoji, role_id: r.role_id}}),
						0,
						message.guild.id,
						message.id
					], (err, rows)=> {
						if(err) console.log(err);
					})
				}
			} else {
				var posts = await bot.utils.genReactPosts(bot, roles, msg, {
					title: cat.name,
					description: cat.description
				})
				for(var i = 0; i < cat.posts.length; i++) {
					var pst = await bot.utils.getReactionRolePost(bot, id, cat.posts[i]);
					if(!pst) continue;
					var message;
					try {
						message = await bot.getMessage(pst.channel_id, pst.message_id);
					} catch(e) {
						console.log(e);
						continue;
					}
					
					if(pst.page > 0) return await message.delete();

					await bot.editMessage(message.channel.id, message.id, {embed: posts[pst.page].embed})

					var emoji = posts[pst.page].emoji;
					message.removeReactions();
					emoji.forEach(async rc => message.addReaction(rc));

					bot.db.query(`UPDATE reactposts SET roles = ? WHERE server_id = ? AND message_id=?`,[
						posts[pst.page].roles,
						message.guild.id,
						message.id
					], (err, rows)=> {
						if(err) console.log(err);
					})
				}
			}
			
			res(true);
		})
	},
	deleteReactionCategory: async (bot, id, categoryid) => {
		return new Promise(async res => {
			var category = await bot.utils.getReactionCategory(bot, id, categoryid);
			if(!category) return res("true");
			console.log(category);
			category.posts.map(async p => {
				var post = await bot.utils.getReactionRolePost(bot, id, p);
				console.log(post);
				if(!post) return null;
				try {
					bot.deleteMessage(post.channel_id, post.message_id);
				} catch(e) {
					console.log(e)
				}
				bot.db.query(`DELETE FROM reactposts WHERE server_id=? AND message_id=?`,[id, p]);
			})
			bot.db.query(`DELETE FROM reactcategories WHERE server_id=? AND hid=?`,[id, categoryid]);
			res(true);
		})
	},
	deleteReactionCategories: async (bot, id) => {
		return new Promise(async res => {
			bot.db.query(`DELETE FROM reactcategories WHERE server_id=?`,[id], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			});
		})
	},

	//reaction role posts
	getReactionRolePosts: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactposts WHERE server_id = ?`,[id], {
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String,
				roles: JSON.parse,
				page: Number
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
	getReactionRolePost: async (bot, id, postid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactposts WHERE server_id=? AND message_id=?`,[id, postid],{
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String,
				roles: JSON.parse,
				page: Number
			},(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	deleteReactionRolePosts: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`DELETE * FROM reactposts WHERE server_id = ?`, [id], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	},

	//other reaction utils
	getHighestPage: async (bot, id, hid) => {
		return new Promise(async res => {
			var category = await bot.utils.getReactionCategory(bot, id, hid);
			if(!category) return res(false);
			bot.db.query(`SELECT MAX(page) AS max FROM reactposts WHERE message_id IN (${category.posts.join(", ")})`, (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					console.log(rows[0].max)
					res(rows[0].max)
				}
			})
		})
	},

	//starboard
	starMessage: async function(bot, msg, channel, data) {
		var attach = [];
		if(msg.attachments[0]) {
			for(var i = 0; i < msg.attachments.length; i++) {
				var att = await bot.fetch(msg.attachments[i].url);
				att = Buffer.from(await att.buffer());
				if(att.length > 8000000) continue;
				attach.push({file: att, name: msg.attachments[i].filename});
			}
		}
		var embed = {
			author: {
				name: `${msg.author.username}#${msg.author.discriminator}`,
				icon_url: msg.author.avatarURL
			},
			footer: {
				text: msg.channel.name
			},
			description: (msg.content || "*(image only)*") + `\n\n[Go to message](https://discordapp.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`,
			timestamp: new Date(msg.timestamp)
		}
		bot.createMessage(channel, {content: `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`,embed: embed}, attach ? attach : null).then(message => {
			bot.db.query(`INSERT INTO starboard (server_id, channel_id, message_id, original_id, emoji) VALUES (?,?,?,?,?)`,[
				message.guild.id,
				message.channel.id,
				message.id,
				msg.id,
				data.emoji
			])
		});
	},
	updateStarPost: async (bot, server, msg, data) => {
		return new Promise((res) => {
			bot.db.query(`SELECT * FROM starboard WHERE original_id=? AND server_id=? AND emoji=?`,[msg, server, data.emoji], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					var post = rows[0];
					if(!post) return res(true);
					try {
						if(data.count > 0) bot.editMessage(post.channel_id, post.message_id, `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`);
						else bot.deleteMessage(post.channel_id, post.message_id);
					} catch(e) {
						console.log(e);
						return res(false);
					}
					res(true);
					
				}
			})
		})
	},
	getStarPosts: async (bot, server) => {
		return new Promise((res) => {
			bot.db.query(`SELECT * FROM starboard WHERE server_id=?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					res(rows);
				}
			})
		})
	},
	getStarPost: async (bot, server, msg, emoji) => {
		return new Promise((res) => {
			bot.db.query(`SELECT * FROM starboard WHERE server_id=? AND original_id=? AND emoji=?`,[server, msg, emoji], (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					res(rows[0]);
				}
			})
		})
	},
	deleteStarPosts: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM starboard WHERE server_id = ?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},

	//bans
	getRawBanLogs: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ?`, [server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined)
				}
			})
		})
	},
	getBanLogs: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ?`, [server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var logs = [];
						for(var i = 0; i < rows.length; i++) {
							var message;

							try {
								message = await bot.getMessage(rows[i].channel_id, rows[i].message_id);
							} catch(e) {
								console.log(e.stack);
								await bot.utils.deleteBanLog(bot, rows[i].hid, server);
								continue;
							}

							rows[i].embed = message.embeds[0];
							logs.push(rows[i]);
						}

						res(logs);
					} else res(undefined)
				}
			})
		})
	},
	getBanLog: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE hid = ? AND server_id = ?`, [hid, server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var message = await bot.getMessage(rows[0].channel_id, rows[0].message_id);

						if(message) rows[0].embed = message.embeds[0];
						else await bot.utils.deleteBanLog(bot, rows[0].hid, server);

						res(rows[0]);

					} else res(undefined)
				}
			})
		})
	},
	getBanLogByMessage: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var message = await bot.getMessage(rows[0].channel_id, rows[0].message_id);

						if(message) rows[0].embed = message.embeds[0];
						else {
							rows[0] = "deleted";
							await deleteBanLog(bot, rows[0].hid, server)
						}

						res(rows[0]);

					} else res(undefined)
				}
			})
		})
	},
	getRawBanLogByMessage: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	getBanLogByUser: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND users LIKE ?`, [server, `%"${user}"%`], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var message = await bot.getMessage(rows[0].channel_id, rows[0].message_id);

						if(message) rows[0].embed = message.embeds[0];
						else {
							rows[0] = "deleted";
							await deleteBanLog(bot, rows[0].hid, server)
						}

						res(rows[0]);

					} else res(undefined)
				}
			})
		})
	},
	getBanLogsByUser: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM ban_logs WHERE server_id = ? AND users LIKE ?`, [server, `%"${user}"%`], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				users: (val) => val ? JSON.parse(val) : undefined,
				reason: String,
				timestamp: String
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var logs = [];
						for(var i = 0; i < rows.length; i++) {
							var message;

							try {
								message = await bot.getMessage(rows[i].channel_id, rows[i].message_id);
							} catch(e) {
								console.log(e.stack);
								await bot.utils.deleteBanLog(bot, rows[i].hid, server);
								continue;
							}

							rows[i].embed = message.embeds[0];
							logs.push(rows[i]);
						}

						res(logs);

					} else res(undefined)
				}
			})
		})
	},
	addBanLog: async (bot, hid, server, channel, message, users, reason, timestamp) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO ban_logs (hid, server_id, channel_id, message_id, users, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,[hid, server, channel, message, users, reason || "(no reason given)", timestamp || new Date()], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	deleteBanLog: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM ban_logs WHERE hid = ? AND server_id = ?`, [hid, server], async (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					var scc = await bot.utils.deleteReceipt(bot, hid, server);
					res(scc);
				}
			})
		})
	},
	deleteBanLogs: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM ban_logs server_id = ?`, [server], async (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					var scc = await bot.utils.deleteReceipts(bot, server);
					res(scc);
				}
			})
		})
	},
	scrubBanLogs: async (bot, server, user) => {
		return new Promise(async res => {
			var logs = await bot.utils.getBanLogsByUser(bot, server, user);
			if(!logs || !logs[0]) return res(true);

			for(var i = 0; i < logs.length; i++) {
				if(logs[i].users.length > 1) {
					logs[i].users = logs[i].users.filter(x => x != user);
					await bot.utils.updateBanLog(bot, logs[i].hid, server, {users: logs[i].users});

					var ind = logs[i].embed.fields[1].value.split("\n").indexOf(user);
					if(ind > -1) {
						var usernames = logs[i].embed.fields[0].value.split("\n");
						usernames.splice(ind, 1);
						logs[i].embed.fields[0].value = usernames.join("\n");
					}
					logs[i].embed.fields[1].value = logs[i].embed.fields[1].value.replace(new RegExp(`(?:\\n${user}|${user}\\n)`),"");
					console.log(logs[i].embed);
					try {
						await bot.editMessage(logs[i].channel_id, logs[i].message_id, {embed: logs[i].embed});
					} catch(e) {
						console.log(e);
						//not much we can really do about it
					}
				} else {
					await bot.deleteMessage(logs[i].channel_id, logs[i].message_id)
				}
			}

			res(true);
		})
	},
	updateBanLog: async (bot, hid, server, data) => {
		return new Promise(async res => {
			bot.db.query(`UPDATE ban_logs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE hid = ? AND server_id=?`,[...Object.values(data), hid, server], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},

	//delists and denials
	getRawListingLogs: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM listing_logs WHERE server_id = ?`, [server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				server_name: String,
				reason: String,
				timestamp: String,
				type: Number
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined)
				}
			})
		})
	},
	getListingLogs: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM listing_logs WHERE server_id = ?`, [server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				server_name: String,
				reason: String,
				timestamp: String,
				type: Number
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var logs = [];
						for(var i = 0; i < rows.length; i++) {
							var message;

							try {
								message = await bot.getMessage(rows[i].channel_id, rows[i].message_id);
							} catch(e) {
								console.log(e.stack);
								await bot.utils.deleteBanLog(bot, rows[i].hid, server);
								continue;
							}

							rows[i].embed = message.embeds[0];
							logs.push(rows[i]);
						}

						res(logs);
					} else res(undefined)
				}
			})
		})
	},
	getListingLog: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM listing_logs WHERE hid = ? AND server_id = ?`, [hid, server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				server_name: String,
				reason: String,
				timestamp: String,
				type: Number
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var message;

						try {
							message = await bot.getMessage(rows[0].channel_id, rows[0].message_id);
						} catch(e) {
							console.log(e.stack);
							await bot.utils.deleteBanLog(bot, rows[0].hid, server);
							return res(undefined);
						}

						rows[0].embed = message.embeds[0];
						res(rows[0]);
					} else res(undefined)
				}
			})
		})
	},
	getRawListingLogByMessage: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM listing_logs WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				server_name: String,
				reason: String,
				timestamp: String,
				type: Number
			}, async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	addListingLog: async (bot, hid, server, channel, message, name, reason, timestamp, type) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO listing_logs (hid, server_id, channel_id, message_id, server_name, reason, timestamp, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,[hid, server, channel, message, name, reason || "(no reason given)", timestamp || new Date(), type], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	deleteListingLog: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM listing_logs WHERE hid = ? AND server_id = ?`, [hid, server], async (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true);
				}
			})
		})
	},
	deleteListingLogs: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM listing_logs server_id = ?`, [server], async (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true);
				}
			})
		})
	},
	updateListingLog: async (bot, hid, server, data) => {
		return new Promise(async res => {
			bot.db.query(`UPDATE listing_logs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE hid = ? AND server_id=?`,[...Object.values(data), hid, server], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},

	//receipts
	getReceipts: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM receipts WHERE server_id = ?`, [server], 
			{
				id: Number,
				hid: String,
				server_id: String,
				message: String,
				link: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows)
				}
			})
		})
	},
	getReceipt: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM receipts WHERE hid = ? AND server_id = ?`, [hid, server],
			{
				id: Number,
				hid: String,
				server_id: String,
				message: String,
				link: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	addReceipt: async (bot, hid, server, message) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO receipts (hid, server_id, message, link) VALUES (?, ?, ?, ?)`, [hid, server, message, ""], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	},
	editReceipt: async (bot, hid, server, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE receipts SET ? = ? WHERE hid = ? AND server_id = ?`, [key, val, hid, server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	},
	deleteReceipt: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM receipts WHERE hid = ? AND server_id = ?`, [hid, server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	deleteReceipts: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM receipts WHERE server_id = ?`, [server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	linkReceipts: async (bot, server, hid1, hid2, message) => {
		return new Promise(async res => {
			var receipt = await bot.utils.getReceipt(bot, hid1, server);
			var receipt2 = await bot.utils.getReceipt(bot, hid2, server);
			if(!receipt) {
				bot.db.query(`INSERT INTO receipts (hid, server_id, message, link) VALUES (?,?,?,?)`, [hid1, server, message, receipt2.link || hid2], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false);
					} else {
						bot.db.query(`UPDATE receipts SET message=?, link=? WHERE hid=? AND server_id=?`, [message, receipt2.link || hid2, hid2, server], (err, rows)=> {
							if(err) {
								console.log(err);
								res(false);
							} else {
								res(true)
							}
						})
						
					}
				})
			} else if(!receipt2) {
				bot.db.query(`INSERT INTO receipts (hid, server_id, message, link) VALUES (?,?,?,?)`, [hid2, server, message, hid2], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false);
					} else {
						bot.db.query(`UPDATE receipts SET message=?, link=? WHERE hid=? AND server_id=?`, [message, hid2, hid1, server], (err, rows)=> {
							if(err) {
								console.log(err);
								res(false);
							} else {
								res(true)
							}
						})
					}
				})
			} else {
				bot.db.query(`UPDATE receipts SET message=?, link=? WHERE hid=? AND server_id=?;
							  UPDATE receipts SET message=?, link=? WHERE hid=? AND server_id=?`,
							  [message, receipt2.link || hid2, hid1, server,
							   message, receipt2.link || hid2, hid2, server], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false);
					} else {
						res(true)
					}
				})
			}
		})
	},
	getLinkedReceipts: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM receipts WHERE link = ? AND server_id = ?`, [hid, server],
			{
				id: Number,
				hid: String,
				server_id: String,
				message: String,
				link: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows)
				}
			})
		})
	},

	//feedback
	addFeedbackTicket: async (bot, hid, server, user, message, anon) => {
		return new Promise(async res=> {
			bot.db.query(`INSERT INTO feedback (hid, server_id, sender_id, message, anon) VALUES (?,?,?,?,?)`,
				[hid, server, user, message, anon], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(true);
					}
				})
		})
	},
	getFeedbackTickets: async (bot, server) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ?`, [server],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(rows);
					}
				}) 
		})
	},
	getFeedbackTicket: async (bot, server, hid) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ? AND hid = ?`, [server, hid],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(rows[0]);
					}
				}) 
		})
	},
	getFeedbackTicketsFromUser: async (bot, server, id) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ? AND sender_id = ? AND anon = 0`, [server, id],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(rows);
					}
				}) 
		})
	},
	searchFeedbackTickets: async (bot, server, query) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ?`,[server],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(rows.filter(r => r.message.toLowerCase().includes(query)));
				}
			})
		})
	},
	searchFeedbackTicketsFromUser: async (bot, server, id, query) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ? AND sender_id = ? AND anon = 0`,[server, id],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(rows.filter(r => r.message.toLowerCase().includes(query)));
				}
			})
		})
	},
	deleteFeedbackTicket: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM feedback WHERE server_id = ? AND hid = ?`,[server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteFeedbackTickets: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM feedback WHERE server_id = ?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	fetchUser: async (bot, id) => {
		return new Promise(async res => {
			try {
				var user = await bot.getRESTUser(id);
			} catch(e) {
				console.log(e);
				var user = undefined;
			}
			res(user);
		})
	},

	//ticket configs
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

	//tickets
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

	//ticket posts
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
	},

	//syncing
	getSyncConfig: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM sync WHERE server_id = ?`,[server], {
				id: Number,
				server_id: String,
				sync_id: String,
				confirmed: Boolean,
				syncable: Boolean,
				sync_notifs: String,
				ban_notifs: String,
				enabled: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0])
			})
		})
	},
	updateSyncConfig: async (bot, server, data) => {
		return new Promise(async res => {
			var cfg = await bot.utils.getSyncConfig(bot, server);
			if(!cfg) {
				bot.db.query(`INSERT INTO sync 
							 (server_id, sync_id, confirmed, syncable, sync_notifs, ban_notifs, enabled) VALUES 
							 (?,?,?,?,?,?,?)`,
							 [server, data.sync_id || "", data.confirmed || 0,  data.syncable || 0,
							 data.sync_notifs || "", data.ban_notifs || "", data.enabled || 1], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(true)
					}
				}) 
			} else {
				bot.db.query(`UPDATE sync SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=?`,[...Object.values(data), server], (err, rows)=> {
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
	addSyncMenu: async (bot, server, channel, message, type, rserver, rchannel) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO sync_menus (server_id, channel_id, message_id, type, reply_guild, reply_channel)
						  VALUES (?,?,?,?,?,?)`,
						  [server, channel, message, type, rserver, rchannel],
			(err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
		  })
		})
	},
	getSyncMenu: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM sync_menus WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[server, channel, message], {
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String,
				type: Number,
				reply_guild: String,
				reply_channel: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0])
			})
		})
	},
	getSyncRequest: async (bot, server, requester) => {
		var scfg = await bot.utils.getSyncConfig(bot, requester);
		if(!scfg || !scfg.sync_id || scfg.sync_id != server) return Promise.resolve(undefined);
		return new Promise(res => {
			bot.db.query(`SELECT * FROM sync_menus WHERE server_id = ? AND reply_guild = ?`,[server, requester], {
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String,
				type: Number,
				reply_guild: String,
				reply_channel: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res({channel: rows[0].channel_id, message: rows[0].message_id,
									requester: rows[0].reply_guild, requester_channel: rows[0].reply_channel, confirmed: scfg.confirmed});
					else res({requester: scfg.server_id, requester_channel: scfg.sync_notifs, confirmed: scfg.confirmed});
				}
			})
		})
	},
	deleteSyncMenu: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM sync_menus WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[server, channel, message], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true)
			})
		})
	},
	getSyncedServers: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM sync WHERE sync_id=? AND confirmed = ?`,[server, 1],async (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						for(var i = 0; i < rows.length; i++) {
							var guild = bot.guilds.find(g => g.id == rows[i].server_id);
							if(guild) rows[i].guild = guild;
							else rows[i] = "deleted";
						}
						rows = rows.filter(x => x!="deleted");
						if(!rows || !rows[0]) res(undefined);
						else res(rows);
					} else res(undefined);
				}
			})
		})
	},
	unsyncServers: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`UPDATE sync SET sync_id=?, confirmed = ? WHERE sync_id = ?`,["", 0, server],async (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},

	//import/export
	getExportData: async (bot, server) => {
		return new Promise(async res => {
			var config = await bot.utils.getConfig(bot, server);
			var servers = await bot.utils.getServers(bot, server);
			var serverposts = await bot.utils.getAllPosts(bot, server);
			var reactionroles = await bot.utils.getReactionRoles(bot, server);
			var reactioncategories = await bot.utils.getReactionCategories(bot, server);
			var reactionposts = await bot.utils.getReactionRolePosts(bot, server);
			var starposts = await bot.utils.getStarPosts(bot, server);
			var banlogs = await bot.utils.getRawBanLogs(bot, server);
			var receipts = await bot.utils.getReceipts(bot, server);
			var supportconfig = await bot.utils.getSupportConfig(bot, server);
			var ticketposts = await bot.utils.getTicketPosts(bot, server);
			var customcommands = await bot.utils.getCustomCommands(bot, server);

			res({
				config: config,
				servers: servers,
				posts: serverposts,
				reaction_roles: reactionroles,
				reaction_categories: reactioncategories,
				reaction_posts: reactionposts,
				star_posts: starposts,
				ban_logs: banlogs,
				receipts: receipts,
				support_config: supportconfig,
				ticket_posts: ticketposts,
				custom_commands: customcommands
			});
		})
	},
	deleteAllData: async (bot, server) => {
		return new Promise(async res => {
			try {
				await bot.utils.deleteConfig(bot, server);
				await bot.utils.deleteServers(bot, server);
				await bot.utils.deleteReactionRoles(bot, server);
				await bot.utils.deleteReactionCategories(bot, server);
				await bot.utils.deleteReactionRolePosts(bot, server);
				await bot.utils.deleteStarPosts(bot, server);
				await bot.utils.deleteBanLogs(bot, server);
				await bot.utils.deleteSupportConfig(bot, server);
				await bot.utils.deleteTicketPosts(bot, server);
				await bot.utils.deleteSupportTickets(bot, server);
				await bot.utils.deleteCustomCommands(bot, server);
			} catch(e) {
				console.log(e);
				return res(false);
			}
			res(true)
		})
	},
	//WIP
	// importData: async (bot, server) => {

	// }
}