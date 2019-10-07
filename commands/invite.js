module.exports = {
	help: "Sets the invite of a server.",
	usage: [" [id] [invite] - Sets invite of server that has the given ID (note: doesn't hve to be a real invite)"],
	examples: ["ha!invite 1234567890 https://discord.gg/1nVit3"],
	alias: ['link', 'inv'],
	permissions: ["manageMessages"]
}