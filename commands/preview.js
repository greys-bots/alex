module.exports = {
	help: ()=> "Previews a server.",
	usage: ()=> [" [id] - Previews server with a given ID"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage("Please provide a server ID to preview.");
		let guild = await bot.utils.getServer(bot, msg.guild.id, args[0]);
		if(!guild) return msg.channel.createMessage("That server does not exist.");

		var dat = guild.contact_id == undefined || guild.contact_id == "" ? "" : await bot.utils.verifyUsers(bot, guild.contact_id.split(" "));

		var contacts = dat.info ? dat.info.map(user => `${user.mention} (${user.username}#${user.discriminator})`).join("\n") : "(no contact provided)";

		msg.channel.createMessage({embed: {
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
		}})
	},
	permissions: ["manageMessages"]
}