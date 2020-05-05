require('dotenv').config();

const {Pool} = require('pg');
const bot = new (require('Eris'))(process.env.TOKEN, {restMode: true});
bot.utils = require('../utils/general');

async function migrate() {
	return new Promise(async (res, rej) => {
		const db = await require('./__db')(bot);

		var categories = (await db.query(`SELECT * FROM reactcategories`)).rows;
		if(!categories) return;

		for(var category of categories) {
			console.log(category);
			if(!category.posts) continue;
			try {
				await bot.stores.reactCategories.update(category.server_id, category.hid, {hid: category.hid});
				var posts = await bot.stores.reactPosts.getByRowIDs(category.server_id, category.posts);
				for(var post of posts) await bot.stores.reactPosts.update(post.server_id, post.message_id, {category: category.hid});
			} catch(e) {
				console.log(e.message);
			}
		}
	})	
}

migrate();

process.on('unhandledRejection', (e)=> console.log(e.message));