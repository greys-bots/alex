module.exports = {
	help: ()=> "Finds all servers matching a certain name.",
	usage: ()=> [" [name] - Finds every server that has the input in the name"],
	execute: async (bot, msg, args)=>{
		var name = args.join(" ").toLowerCase();
		bot.db.query(`SELECT * FROM servers WHERE host_id=? AND name LIKE ?`,[msg.guild.id, "%"+name+"%"],(err, rows)=>{
			if(err) {
				console.log(err);
				msg.channel.createMessage('There was an error!');
			} else {
				if(!rows[0]) msg.channel.createMessage("None!");
				else msg.channel.createMessage(rows.map(srv => `${srv.name} (${srv.server_id})`).join('\n'))
			}
		})
	},
	alias: ['servers', 'server'],
	permissions: ["manageMessages"]
}