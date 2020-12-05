module.exports = {
	getExportData: async (bot, server) => {
		return new Promise(async res => {
			var config 				= await bot.stores.configs.get(server);
			var servers 			= await bot.stores.servers.getAll(server);
			var posts 				= await bot.stores.serverPosts.getAll(server);
			var reactionroles 		= await bot.stores.reactRoles.getAll(server);
			var reactioncategories 	= await bot.stores.reactCategories.getAll(server);
			var reactionposts 		= await bot.stores.reactPosts.getAll(server);
			var starposts 			= await bot.stores.starPosts.getAll(server);
			var banlogs 			= await bot.stores.banLogs.getAll(server);
			var receipts 			= await bot.stores.receipts.getAll(server);
			var ticketconfig 		= await bot.stores.ticketConfigs.get(server);
			var ticketposts 		= await bot.stores.ticketPosts.getAll(server);
			var customcommands 		= await bot.stores.customCommands.getAll(server);

			res({
				config,
				servers,
				posts,
				reactionroles,
				reactioncategories,
				reactionposts,
				starposts,
				banlogs,
				receipts,
				ticketconfig,
				ticketposts,
				customcommands
			});
		})
	},
	deleteAllData: async (bot, server) => {
		return new Promise(async res => {
			try {
				await bot.stores.configs.delete(server);
				await bot.stores.servers.deleteAll(server);
				await bot.stores.serverPosts.deleteAll(server);
				await bot.stores.reactRoles.deleteAll(server);
				await bot.stores.reactCategories.deleteAll(server);
				await bot.stores.reactPosts.deleteAll(server);
				await bot.stores.starPosts.deleteAll(server);
				await bot.stores.banLogs.deleteAll(server);
				await bot.stores.receipts.deleteAll(server);
				await bot.stores.ticketConfigs.delete(server);
				await bot.stores.ticketPosts.deleteAll(server);
				await bot.stores.customCommands.deleteAll(server);
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