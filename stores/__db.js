var fs = require('fs');
var dblite = require('dblite');

module.exports = (bot) => {
	db = dblite("./data.sqlite","-header");

	db.query(`CREATE TABLE IF NOT EXISTS ban_logs (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		server_id 	TEXT,
		channel_id 	TEXT,
		message_id 	TEXT,
		users 		TEXT,
		reason 		TEXT,
		timestamp 	TEXT
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS commands (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	BIGINT,
		name 		TEXT,
		actions 	TEXT,
		target 		TEXT,
		del 		INTEGER
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS configs (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id   	BIGINT,
        banlog_channel	BIGINT,
        ban_message 	TEXT,
        reprole 		BIGINT,
        delist_channel	BIGINT,
        starboard 		TEXT,
        blacklist 		TEXT,
        feedback 		TEXT
    )`);

	db.query(`CREATE TABLE IF NOT EXISTS feedback (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid			TEXT,
		server_id	TEXT,
		sender_id 	TEXT,
		message 	TEXT,
		anon 		INTEGER
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS listing_logs (
		id 				INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 			TEXT,
		server_id 		TEXT,
		channel_id 		TEXT,
		message_id 		TEXT,
		server_name 	TEXT,
		reason 			TEXT,
		timestamp 		TEXT,
		type 			INTEGER
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS posts (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        host_id 	BIGINT,
        server_id   BIGINT,
        channel_id  BIGINT,
        message_id  BIGINT
    )`);

    db.query(`CREATE TABLE IF NOT EXISTS reactcategories (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
    	hid 			TEXT,
    	server_id		BIGINT,
    	name 			TEXT,
    	description 	TEXT,
    	roles 			TEXT,
    	posts 			TEXT
    )`);

    db.query(`CREATE TABLE IF NOT EXISTS reactroles (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
    	server_id		BIGINT,
    	role_id 		BIGINT,
    	emoji 			TEXT,
    	description 	TEXT
    )`);

    db.query(`CREATE TABLE IF NOT EXISTS reactposts (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		channel_id	TEXT,
		message_id	TEXT,
		roles		TEXT
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS receipts (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		server_id 	TEXT,
		message		TEXT,
		link		TEXT
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS servers(
		id         	INTEGER PRIMARY KEY AUTOINCREMENT,
		host_id 	BIGINT,
        server_id   BIGINT,
        contact_id  TEXT,
        name        TEXT,
        description TEXT,
        invite		TEXT,
        pic_url     TEXT,
        color 		TEXT,
        visibility  INTEGER
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS starboard (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	BIGINT,
		channel_id	BIGINT,
		message_id 	BIGINT,
		original_id BIGINT,
		emoji 		TEXT
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS sync (
		id 				INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 		TEXT,
		sync_id 		TEXT,
		confirmed 		INTEGER,
		syncable 		INTEGER,
		sync_notifs 	TEXT,
		ban_notifs 		TEXT,
		enabled 		INTEGER
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS sync_menus (
		id 				INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 		TEXT,
		channel_id 		TEXT,
		message_id 		TEXT,
		type 			INTEGER,
		reply_guild 	TEXT,
		reply_channel 	TEXT
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS ticket_configs (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		category_id	TEXT,
		archives_id TEXT
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS ticket_posts (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		channel_id	TEXT,
		message_id	TEXT
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS tickets (
		id 				INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 			TEXT,
		server_id 		TEXT,
		channel_id		TEXT,
		first_message 	TEXT,
		opener 			TEXT,
		users 			TEXT,
		timestamp 		TEXT
	)`);

	bot.stores = {};
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(file == "__db.js") continue;
		var name = file.replace(/store\.js/i, "")[0].toLowerCase() + 
				   file.replace(/store\.js/i, "").slice(1) + "s"; //"ProfileStore.js" becomes "profiles"

		bot.stores[name] = require(__dirname+'/'+file)(bot, db);
	}

	return db;
}