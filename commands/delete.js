module.exports = {
	help: "Deletes a server",
	usage: [" [serverID] [serverID] ... (new line) [reason] - Deletes given server(s) and all posts related."],
	examples: ["ha!delete 123456789 6294810<br/>These servers are mean :("],
	alias: ['delist'],
	permissions: ["manageMessages"]
}
