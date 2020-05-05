module.exports = {
	genEmbeds: async (bot, arr, genFunc, info = {}, fieldnum, extras = {}) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: typeof info.title == "function" ?
								info.title(arr[0], 0) : info.title,
						description: typeof info.description == "function" ?
								info.description(arr[0], 0) : info.description,
				color: typeof info.color == "function" ?
						info.color(arr[0], 0) : info.color,
				footer: info.footer,
				fields: []
			}};
			
			for(let i=0; i<arr.length; i++) {
				if(current.embed.fields.length < (fieldnum || 10)) {
					current.embed.fields.push(await genFunc(arr[i], bot));
				} else {
					embeds.push(current);
					current = { embed: {
						title: typeof info.title == "function" ?
								info.title(arr[i], i) : info.title,
						description: typeof info.description == "function" ?
								info.description(arr[i], i) : info.description,
						color: typeof info.color == "function" ?
								info.color(arr[i], i) : info.color,
						footer: info.footer,
						fields: [await genFunc(arr[i], bot)]
					}};
				}
			}
			embeds.push(current);
			if(extras.order && extras.order == 1) {
				if(extras.map) embeds = embeds.map(extras.map);
				if(extras.filter) embeds = embeds.filter(extras.filter);
			} else {
				if(extras.filter) embeds = embeds.filter(extras.filter);
				if(extras.map) embeds = embeds.map(extras.map);
			}
			if(embeds.length > 1) {
				for(let i = 0; i < embeds.length; i++)
					embeds[i].embed.title += (extras.addition != null ? eval("`"+extras.addition+"`") : ` (page ${i+1}/${embeds.length}, ${arr.length} total)`);
			}
			res(embeds);
		})
	},
	genReactPosts: async (bot, roles, info = {}) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: info.title,
				description: info.description,
				fields: [],
				footer: info.footer
			}, roles: [], emoji: []};
			
			for(let i=0; i<roles.length; i++) {
				if(current.embed.fields.length < 10) {
					current.embed.fields.push({
						name: `${roles[i].raw.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`,
						value: `Description: ${roles[i].description || "*(no description provided)*"}\nPreview: ${roles[i].raw.mention}`
					});
					current.roles.push(roles[i].id);
					current.emoji.push(roles[i].emoji);
				} else {
					embeds.push(current);
					current = { embed: {
						title: info.title,
						description: info.description,
						fields: [],
						footer: info.footer
					}, roles: [], emoji: []};
					current.embed.fields.push({
						name: `${roles[i].raw.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`,
						value: `Description: ${roles[i].description || "*(no description provided)*"}\nPreview: ${roles[i].raw.mention}`
					});
					current.roles.push(roles[i].id);
					current.emoji.push(roles[i].emoji);
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
			case "⬅️":
				if(this.index == 0) {
					this.index = this.data.length-1;
				} else {
					this.index -= 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
				await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, this.user)
				bot.menus[m.id] = this;
				break;
			case "➡️":
				if(this.index == this.data.length-1) {
					this.index = 0;
				} else {
					this.index += 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
				await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, this.user)
				bot.menus[m.id] = this;
				break;
			case "⏹️":
				await bot.deleteMessage(m.channel.id, m.id);
				delete bot.menus[m.id];
				break;
		}
	},
	fetchUser: async (bot, id) => {
		return new Promise(async (res, rej) => {
			var user = bot.users.find(x => x.id == id);
			if(!user) {
				try{
					user = await bot.getRESTUser(id);
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
			}

			res(user);
		})
	},
	cleanText: function(text){
		if (typeof(text) === "string") {
			return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
		} else	{
			return text;
		}
	}
}