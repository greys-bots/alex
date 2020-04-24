module.exports = {
	help: ()=> "Previews a server",
	usage: ()=> [" [id] - Previews server with a given ID"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return "Please provide a server ID to preview";
		let guild = await bot.stores.servers.get(msg.guild.id, args[0]);
		if(!guild) return "Server not found!";

		var contacts;
		if(!guild.contact_id || !guild.contact_id[0]) contacts = "(no contact provided)";
		else {
			var dat = await bot.utils.verifyUsers(bot, guild.contact_id);
			contacts = dat.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n");
		}
		return {embed: {
			title: guild.name || "(unnamed)",
			description: guild.description || "(no description provided)",
			fields: [
				{name: "Contact", value: contacts || "(no contact registered)"},
				{name: "Link", value: guild.invite ? guild.invite : "(no link provided)"},
				{name: "Members", value: guild.guild ? guild.guild.memberCount : "(unavailable)"}
			],
			thumbnail: {
				url: guild.pic_url
			},
			color: 3447003,
			footer: {
				text: `ID: ${guild.server_id} | This server ${guild.visibility ? "is" : "is not"} visible on the website`
			}
		}};
	},
	permissions: ["manageMessages"],
	guildOnly: true
}