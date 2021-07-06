module.exports = {
	help: ()=> "Manage server support tickets",
	usage: ()=> [" - List open tickets",
				 " post [channel] - Post the ticket starter message to a channel",
				 " bind [channel] [messageID] - Bind ticket reacts to a specific message",
				 " unbind [channel] [messageID] - Unbind ticket reacts from a specific message",
				 " add <hid> [user] [user] ... - Add users to a ticket",
				 " remove <hid> [user] [user] ... - Remove users from a ticket",
				 " find [userID] - Find tickets started by the given user",
				 " archive <hid> - Archive a ticket (sends text transcript to command user and deletes channel)",
				 " delete [hid] - Delete a ticket. NOTE: Does not archive it automatically; use this if you don't plan on archiving it",
				 " config - Configure the ticket system"],
	desc: ()=> "Before using this, you should run `ha!ticket config setup`. Use `ha!ticket post [channel]` or `ha!ticket bind [channel] [messageID]` to open the system for reactions and ticket creation. Users can have a total of 5 tickets open at once to prevent spam.",
	execute: async (bot, msg, args) => {
		var tickets = await bot.stores.tickets.getAll(msg.guild.id);
		if(!tickets || !tickets[0]) return "No support tickets registered for this server";

		var embeds = tickets.map(t => {
			return {embed: {
				title: `Ticket ${t.hid}`,
				fields: [
					{name: "First message", value: `[clicky!](https://discordapp.com/channels/${msg.guild.id}/${t.channel_id}/${t.first_message})`},
					{name: "Ticket opener", value: `${t.opener.mention} (${t.opener.username}#${t.opener.discriminator})`},
					{name: "Ticket users", value: `${[t.opener].concat(t.users).map(u => `${u.mention} (${u.username}#${u.discriminator})`).join("\n")}`}
				],
				timestamp: t.timestamp
			}}
		})

		if(embeds[1]) for(var i = 0; i < embeds.length; i++) embeds[i].embed.title += ` (${i+1}/${embeds.length})`;

		return embeds;
	},
	permissions: ["manageMessages"],
	guildOnly: true
}