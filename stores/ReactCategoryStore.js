const {Collection} = require("discord.js");

class ReactCategoryStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO reactcategories (
					hid,
					server_id,
					name,
					description,
					roles,
					posts
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[hid, server, data.name || "", data.description || "",
				data.roles || [], data.posts || []]);
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
				var category = super.get(`${server}-${hid}`);
				if(category) return res(category);
			}

			try {
				var data = await this.db.query(`SELECT * FROM reactcategories WHERE server_id = $1 AND hid = $2`,[server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				var posts = [];
				var roles = [];

				for(var post of data.rows[0].posts) {
					try {
						var rpost = await this.bot.stores.reactPosts.getByRowID(server, post);
					} catch(e) {
						continue;
					}
					posts.push(rpost);
				}

				for(var role of data.rows[0].roles) {
					try {
						var rl = await this.bot.stores.reactRoles.getByRowID(server, role);
					} catch(e) {
						continue;
					}
					roles.push(rl);
				}
				data.rows[0].raw_posts = data.rows[0].posts;
				data.rows[0].posts = posts;
				data.rows[0].raw_roles = data.rows[0].roles;
				data.rows[0].roles = roles;
				this.set(`${server}-${hid}`, data.rows[0]);
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByRole(server, role, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			try {
				var categories = await this.getAll(server);
			} catch(e) {
				return rej(e);
			}

			categories = categories.filter(c => c.roles.find(r => r.id == role) || c.raw_roles.includes(role));
			if(categories[0]) res(categories);
			else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM reactcategories WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					var posts = [];
					for(var post of data.rows[i].posts) {
						try {
							var rpost = await this.bot.stores.reactPosts.getByRowID(server, post);
						} catch(e) {
							continue;
						}
						posts.push(rpost);
					}
					for(var role of data.rows[i].roles) {
						try {
							var rl = await this.bot.stores.reactRoles.getByRowID(server, role);
						} catch(e) {
							continue;
						}
						roles.push(rl);
					}
					data.rows[i].raw_posts = data.rows[i].posts;
					data.rows[i].posts = posts;
					data.rows[i].raw_roles = data.rows[i].roles;
					data.rows[i].roles = posts;
				}
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE reactcategories SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1, hid = $1`,[server, hid, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			var category = await this.get(server, hid, true);

			var embeds = await this.bot.utils.genReactPosts(this.bot, category.roles.map(r => {
				return {
					raw: guild.roles.find(rl => rl.id == r.role_id),
					emoji: r.emoji
				}
			}), {
				title: category.name,
				description: category.description,
				footer: {
					text: "Category ID: "+category.hid
				}
			});

			for(var post of category.posts) {
				try {
					await this.bot.stores.reactPosts.update(server, post.message_id, {roles: category.raw_roles, post: embeds[post.page]});
				} catch(e) {
					return rej(e);
				}
			}
			res(category);
		})
	}

	async delete(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM reactcategories WHERE server_id = $1 AND hid = $2`, [server, hid]);
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
				var categories = await this.getAll(server);
				await this.db.query(`DELETE FROM reactcategories WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			for(category of categories) super.delete(`${server}-${category.hid}`);
			res();
		})
	}
}

module.exports = (bot, db) => new ReactCategoryStore(bot, db);