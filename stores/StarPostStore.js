const {Collection} = require("discord.js");
const fetch = require("node-fetch");

class StarPostStore extends Collection {
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

	async create(server, channel, msg, data = {}) {
		return new Promise(async (res, rej) => {
			var attachments = [];
			if(msg.attachments && msg.attachments[0]) {
				for(var i = 0; i < msg.attachments.length; i++) {
					var att = await fetch(msg.attachments[i].url);
					att = Buffer.from(await att.buffer());
					if(att.length > 8000000) continue;
					attachments.push({file: att, name: msg.attachments[i].filename});
				}
			}
			var embed = {embed: {
				author: {
					name: `${msg.author.username}#${msg.author.discriminator}`,
					icon_url: msg.author.avatarURL
				},
				footer: {
					text: msg.channel.name
				},
				description: (msg.content || "*(image only)*") + `\n\n[Go to message](https://discordapp.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`,
				timestamp: new Date(msg.timestamp).toIOSString();
			}}

			try {
				var message = this.bot.createMessage(channel, {
					content: `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`,
					embed
				}, attachments[0] ? attachments : null);
				await this.db.query(`INSERT INTO starred_messages (
					server_id,
					channel_id,
					message_id,
					original_id,
					emoji
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, channel, message.id, msg.id, data.emoji])
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
				//second line grabs the correct starboard and returns it
				//as a prop specifically called "starboard"
				var data = await this.db.query(`
					SELECT starred_messages.*, (
						SELECT row_to_json((SELECT a FROM (SELECT starboards.*) a))
						FROM starboards WHERE starboards.channel_id = starred_messages.channel_id
					) AS starboard FROM starred_messages WHERE server_id = $1 AND message_id = $2`,
					[server, message]);
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
				var data = await this.db.query(`
					SELECT starred_messages.*, (
						SELECT row_to_json((SELECT a FROM (SELECT starboards.*) a))
						FROM starboards WHERE starboards.channel_id = starred_messages.channel_id
					) AS starboard FROM starred_messages WHERE server_id = $1`,
					[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, message, data = {}) {
		return new Promise(async (res, rej) => {
			//no database updates needed! yay!
			try {
				var post = await this.get(server, message);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			try {
				if(data.count > 0)
					this.bot.editMessage(
						post.channel_id,
						post.message_id,
						`${post.emoji.includes(":") ?
						`<${post.emoji}>` :
						post.emoji} ${data.count}`
					);
				else await this.delete(server, message);
			} catch(e) {
				console.log(e);
				return rej(e.message ? e.message : e);
			}
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
				await this.db.query(`DELETE FROM starred_messages WHERE server_id = $1 AND message_id = $2`, [server, message]);
				super.delete(`${server}-${message}`);
				await this.bot.deleteMessage(post.channel_id, post.message_id);
			} catch(e) {
				console.log(e);
				if(e.message && !e.message.toLowerCase().contains("unknown message")) return rej(e.message);
				else if(!e.message) return rej(e.message);
			}
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

			var reaction = msg.reactions[emoji.name.replace(/^:/,"")];
			var board = await store.bot.stores.starboards.getByEmoji(msg.guild.id, emoji.name);
			if(!board) return res();
			var cfg = await store.bot.stores.configs.get(msg.guild.id);
			var tolerance = board.tolerance ? board.tolerance : cfg.starboard || 2;
			var member = msg.guild.members.find(m => m.id == user);
			if(!member) return rej("Member not found");

			if(reaction.count < tolerance && 
			  (!board.override || (board.override && !member.permission.has("manageMessages")))) 
				return;
			
			var post = await store.get(msg.guild.id, msg.id);
			var scc;
			if(post) {
				scc = await store.update(msg.guild.id, msg.id, {emoji: emoji.name, count: reaction ? reaction.count : 0})
			} else {
				scc = await store.create(msg.guild.id, board.channel_id, msg, {emoji: emoji.name, count: reaction ? reaction.count : 0})
			}
			res(scc);
		})
	}
}

module.exports = (bot, db) => new StarPostStore(bot, db);