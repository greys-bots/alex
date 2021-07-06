var fs = require('fs');
var {Pool} = require('pg');

module.exports = async (bot) => {
	const db = new Pool();

	await db.query(`
		CREATE TABLE IF NOT EXISTS configs (
	    	id 				SERIAL PRIMARY KEY,
	        server_id   	TEXT,
	        prefix 			TEXT
	    );

	    -- React roles

	    CREATE TABLE IF NOT EXISTS reactcategories (
	    	id 				SERIAL PRIMARY KEY,
	    	hid 			TEXT,
	    	server_id		TEXT,
	    	name 			TEXT,
	    	description 	TEXT,
	    	roles 			TEXT[],
	    	posts 			TEXT[],
	    	single 			BOOLEAN,
	    	required 		TEXT
	    );

	    CREATE TABLE IF NOT EXISTS reactroles (
	    	id 				SERIAL PRIMARY KEY,
	    	server_id		TEXT,
	    	role_id 		TEXT,
	    	emoji 			TEXT,
	    	description 	TEXT
	    );

	    CREATE TABLE IF NOT EXISTS reactposts (
			id				SERIAL PRIMARY KEY,
			server_id		TEXT,
			channel_id		TEXT,
			message_id		TEXT,
			category 		TEXT,
			roles			TEXT[],
			page 			INTEGER,
	    	single 			BOOLEAN,
	    	required 		TEXT
		);

		-- Bundles

		CREATE TABLE IF NOT EXISTS bundles (
	    	id 				SERIAL PRIMARY KEY,
	    	hid 			TEXT,
	    	server_id		TEXT,
	    	name 			TEXT,
	    	description 	TEXT,
	    	roles 			TEXT[],
	    	assignable		BOOLEAN
	    );

		CREATE TABLE IF NOT EXISTS selfroles (
	    	id 				SERIAL PRIMARY KEY,
	    	server_id		TEXT,
	    	role_id 		TEXT,
	    	description 	TEXT,
	    	assignable		BOOLEAN
	    );

		CREATE TABLE IF NOT EXISTS usages (
			id 			SERIAL PRIMARY KEY,
			server_id 	TEXT,
			whitelist 	TEXT[],
			blacklist 	TEXT[],
			type 		INTEGER
		);
	`);
	
	bot.stores = {};
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(["__db.js", "__migrations.js", "tmp.js"].includes(file)) continue;
		var name = file.replace(/\.js/i, "");

		bot.stores[name] = require(__dirname+'/'+file)(bot, db);
		if(bot.stores[name].init) bot.stores[name].init();
	}

	return db;
}