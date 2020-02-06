module.exports = async (guild, member, bot) => {
	//update member count
	await bot.utils.updatePostsByServer(bot, guild.id);

	//notify current guild if the user is banned from their synced server
	var scfg = await bot.utils.getSyncConfig(bot, guild.id);
	if(!scfg || (!scfg.sync_id && !scfg.confirmed) || !scfg.ban_notifs) return;
	var log = await bot.utils.getBanLogByUser(bot, scfg.sync_id, member.id);
	if(log && log!="deleted") {
		try {
			await bot.createMessage(scfg.ban_notifs, {embed: {
				title: "Ban Notification",
				description: [
					`New member **${member.username}#${member.discriminator}** (${member.id})`,
					` has been banned from your currently synced server.\n`,
					`Reason:\n`,
					log.embed.fields[2].value
				].join(""),
				color: parseInt("aa5555", 16)
			}})
		} catch(e) {
			console.log(e);
		}
	}
}