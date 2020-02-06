module.exports = {
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