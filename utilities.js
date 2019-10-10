module.exports = {
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
	getServers: async (bot, host) => {
		return new Promise((res)=>{
			bot.db.query(`SELECT * FROM servers WHERE host_id=?`,[host],(err,rows)=>{
				if(err) {
						console.log(err);
						res(undefined)
					} else {
						res(rows);
					}
			})
		})
	},
	getServer: async (bot, host, id) => {
		return new Promise((res)=>{
			bot.db.query(`SELECT * FROM servers WHERE host_id=? AND server_id=?`,[host, id],(err,rows)=>{
				if(err) {
						console.log(err);
						res(undefined)
					} else {
						res(rows[0]);
					}
			})
		})
	},
	getServerByRowID: async (bot, id) => {
		return new Promise((res)=>{
			bot.db.query(`SELECT * FROM servers WHERE id=?`,[id],(err,rows)=>{
				if(err) {
						console.log(err);
						res(undefined)
					} else {
						res(rows[0]);
					}
			})
		})
	},
	getServersWithContact: async (bot, host, id) => {
		return new Promise((res)=>{
			bot.db.query(`SELECT * FROM servers WHERE host_id=? AND contact_id LIKE ?`,[host, "%"+id+"%"],(err,rows)=>{
				if(err) {
						console.log(err);
						res(undefined)
					} else {
						res(rows);
					}
			})
		})
	},
	updateServer: async (bot, host, id, prop, val)=> {
		return new Promise(res=>{
			bot.db.query(`UPDATE servers SET ?=? WHERE host_id=? AND server_id=?`, [prop, val, host, id], (err, rows)=>{
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
	updatePosts: async (bot, host, id) => {
		return new Promise(async res=> {
			var guild = await bot.utils.getServer(bot, host, id)
			if(!guild) {
				console.log('Guild not found')
				res(false);
				return;
			}
			bot.db.query(`SELECT * FROM posts WHERE host_id=? AND server_id=?`,[host, guild.id], async (err, rows)=>{
				if(err) {
					console.log(err);
					res(false);
				} else {
					if(!rows[0]) res(true);
					await Promise.all(rows.map(async p => {
						var dat = guild.contact_id == undefined || guild.contact_id == "" ? "" : await bot.utils.verifyUsers(bot, guild.contact_id.split(" "));
						var contacts = dat.info ? dat.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n") : "(no contact provided)";

						await bot.editMessage(p.channel_id, p.message_id, {embed: {
							title: guild.name || "(unnamed)",
							description: guild.description || "(no description provided)",
							fields: [
								{name: "Contact", value: contacts},
								{name: "Link", value: guild.invite ? guild.invite : "(no link provided)"}
							],
							thumbnail: {
								url: guild.pic_url || ""
							},
							color: 3447003,
							footer: {
								text: `ID: ${guild.server_id}`
							}
						}}).then(() => {
							return new Promise(res2 => {setTimeout(()=>res2(1), 100)})
						}).catch(e => {
							console.log(e);
							return new Promise(res2 => {setTimeout(()=>res2(0), 100)})
						});
					})).then(()=> {
						res(true)
					}).catch(e => {
						console.log(e);
						res(false);
					})
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
					await Promise.all(rows.map(async p => {
						await bot.deleteMessage(p.channel_id, p.message_id).then(() => {
							return new Promise(res2 => {setTimeout(()=>res2(1), 100)})
						}).catch(e => {
							console.log(e);
							return new Promise(res2 => {setTimeout(()=>res2(0), 100)})
						});
					})).then(()=> {
						res(true)
					}).catch(e => {
						console.log(e);
						res(false);
					})
				}
			})
		})
	},
	deletePost: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM posts WHERE message_id=?`,[id],(err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	},
	getConfig: async (bot, id)=> {
		return new Promise(res=>{
			bot.db.query(`SELECT * FROM configs WHERE server_id=?`,[id], {
				id: Number,
		        server_id: String,
		        banlog_channel: String,
		        reprole: String,
		        delist_channel: String,
		        starboard: JSON.parse,
		        blacklist: JSON.parse
			}, (err,rows)=>{
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	updateConfig: async function(bot,srv,key,val) {
		return new Promise((res)=> {
			bot.db.query(`SELECT * FROM configs WHERE server_id=?`,[srv], (err, rows)=> {
				if(err) {
					console.log(err);
				} else {
					if(!rows[0]) {
						bot.db.query(`INSERT INTO configs (server_id, banlog_channel, reprole, delist_channel, starboard, blacklist) VALUES (?,?,?,?,?,?)`,[srv, "", "", "", {}, []]);
					}
				}
			})
			bot.db.query(`UPDATE configs SET ?=? WHERE server_id=?`,[key, val, srv], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	getCustomCommands: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM commands WHERE server_id=?`,[id],(err, rows)=>{
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
					delete: Number
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
						await Promise.all(rows[0].roles.map((r,i) => {
							return new Promise(res2 => {
								bot.db.query(`SELECT * FROM reactroles WHERE id=?`,[r], (err, rls)=> {
									roles[i] = rls[0]
								});
								setTimeout(()=> res2(''), 100)
							})
						})).then(()=> {
							res(roles)
						})
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
	updateReactCategoryPosts: async (bot, id, msg, categoryid) => {
		return new Promise(async res => {
			var cat = await bot.utils.getReactionCategory(bot, id, categoryid);
			if(!cat) return res(false);
			if(!cat.posts || !cat.posts[0]) return res(true);
			var roles = await bot.utils.getReactionRolesByCategory(bot, msg.guild.id, cat.hid);
			if(!roles) return res(false);
			if(roles.length == 0) {
				await Promise.all(cat.posts.map(async p => {
					var pst = await bot.utils.getReactionRolePost(bot, id, p);
					if(!pst) return Promise.resolve("")
					var message = await bot.getMessage(pst.channel_id, pst.message_id);
					if(!message) return Promise.resolve("")
					await message.delete();
					bot.db.query(`DELETE FROM reactposts WHERE server_id = ? AND message_id=?`, [
						message.guild.id,
						message.id
					], (err, rows)=> {
						if(err) console.log(err);
					})

				}))
			} else if(roles.length <= 10) {
				await Promise.all(cat.posts.map(async p => {
					var pst = await bot.utils.getReactionRolePost(bot, id, p);
					if(!pst) return Promise.resolve("")
					var message = await bot.getMessage(pst.channel_id, pst.message_id);
					if(!message) return Promise.resolve("")
					if(pst.page > 0) return await message.delete();
					console.log(pst.page);

					bot.editMessage(message.channel.id, message.id, {embed: {
						title: cat.name,
						description: cat.description,
						fields: roles.map(r => {
							var rl = msg.guild.roles.find(x => x.id == r.role_id);
							return {name: `${rl.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`, value: r.description || "*(no description provided)*"}
						})
					}}).then(message => {	
						var emoji = roles.map(r => r.emoji);
						var oldreacts = Object.keys(message.reactions)
										.filter(rr => message.reactions[rr].me)
										.filter(rr => !emoji.includes(rr) && !emoji.includes(":"+rr));
						emoji.forEach(rc => message.addReaction(rc));
						oldreacts.forEach(rc => message.removeReaction(rc.replace(/^:/,"")));
						if(roles.length > 10) {
							message.addReaction("\u2b05");
							message.addReaction("\u27a1");
						}

						bot.db.query(`UPDATE reactposts SET roles = ?, page=? WHERE server_id = ? AND message_id=?`,[
							roles.map(r => {return {emoji: r.emoji, role_id: r.role_id}}),
							0,
							message.guild.id,
							message.id
						], (err, rows)=> {
							if(err) console.log(err);
						})
					}).catch(e => {
						console.log(e);
						res(false)
					})

				}))
			} else {
				var posts = await bot.utils.genReactPosts(bot, roles, msg, {
					title: cat.name,
					description: cat.description
				})
				await Promise.all(cat.posts.map(async p => {
					var pst = await bot.utils.getReactionRolePost(bot, id, p);
					if(!pst) return Promise.resolve("");
					var message = await bot.getMessage(pst.channel_id, pst.message_id);
					if(!message) return Promise.resolve("");
					bot.editMessage(message.channel.id, message.id, {embed: posts[pst.page].embed}).then(message => {	
						var emoji = posts[pst.page].emoji;
						var oldreacts = Object.keys(message.reactions)
										.filter(rr => message.reactions[rr].me)
										.filter(rr => !emoji.includes(rr) && !emoji.includes(":"+rr));
						emoji.forEach(async rc => message.addReaction(rc));
						oldreacts.forEach(rc => message.removeReaction(rc.replace(/^:/,"")));


						bot.db.query(`UPDATE reactposts SET roles = ? WHERE server_id = ? AND message_id=?`,[
							posts[pst.page].roles,
							message.guild.id,
							message.id
						], (err, rows)=> {
							if(err) console.log(err);
						})
					}).catch(e => {
						console.log(e);
						res(false)
					})

				}))
			}
			
			res(true);
		})
	},
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
	verifyUsers: async (bot, ids) => {
		return new Promise(async res=>{
			var results = {
				pass: [],
				fail: [],
				info: []
			};
			console.log(results)
			await Promise.all(ids.map(async id => {
				console.log(id)
				var user;
				try {
					user = await bot.getRESTUser(id);
					if(user) {
						results.pass.push(id);
						results.info.push(user);
					}
				} catch(e) {
					results.fail.push(id);
				}
			})).then(()=> {
				res(results);
			})
		})
	},
	starMessage: async function(bot, msg, channel, data) {
		var attach = [];
		if(msg.attachments[0]) {
			await Promise.all(msg.attachments.map(async (f,i) => {
				var att = await bot.fetch(f.url);
				attach.push({file: Buffer.from(await att.buffer()), name: f.filename});
				return new Promise(res => {
					setTimeout(()=> res(1), 100);
				})
			}))
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

	//bans
	getBanLog: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM banlogs WHERE hid = ? AND server_id = ?`, [hid, server], async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var message = await bot.getMessage(rows[0].channel_id, rows[0].message_id);

						if(message) rows[0].embed = message.embeds[0];
						else {
							rows[0] = "deleted";
							await removeBanLog(bot, hid, server)
						}

						res(rows[0]);

					} else res(undefined)
				}
			})
		})
	},
	getBanLogByMessage: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM banlogs WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message], async (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) {
						var message = await bot.getMessage(rows[0].channel_id, rows[0].message_id);

						if(message) rows[0].embed = message.embeds[0];
						else {
							rows[0] = "deleted";
							await removeBanLog(bot, hid, server)
						}

						res(rows[0]);

					} else res(undefined)
				}
			})
		})
	},
	addBanLog: async (bot, hid, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO banlogs (hid, server_id, channel_id, message_id) VALUES (?, ?, ?, ?)`,[hid, server, channel, message], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	removeBanLog: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM banlogs WHERE hid = ? AND server_id = ?`, [hid, server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					bot.db.query(`DELETE FROM receipts WHERE hid = ? AND server_id = ?`, [hid, server], (err, rows) => {
						if(err) {
							console.log(err);
							res(false);
						} else {
							res(true)
						}
					})
				}
			})
		})
	},

	//receipts
	getReceipt: async (bot, hid, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM receipts WHERE hid = ? AND server_id = ?`, [hid, server], (err, rows) => {
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
			bot.db.query(`INSERT INTO receipts (hid, server_id, message) VALUES (?, ?, ?)`, [hid, server, message], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	},
	editReceipt: async (bot, hid, server, message) => {
		return new Promise(res => {
			bot.db.query(`UPDATE receipts SET message = ? WHERE hid = ? AND server_id = ?`, [message, hid, server], (err, rows) => {
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
	}
}