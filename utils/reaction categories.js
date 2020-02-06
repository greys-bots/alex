module.exports = {
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
	}
}