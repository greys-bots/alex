var fs = require('fs');
var dblite = require('dblite');
var {Pool} = require('pg');

module.exports = async (bot) => {
	// db = dblite("./data.sqlite","-header");
	const db = new Pool();

	await db.query(`
		CREATE TABLE IF NOT EXISTS ban_logs (
			id 				SERIAL PRIMARY KEY,
			hid 			TEXT,
			server_id 		TEXT,
			channel_id 		TEXT,
			message_id 		TEXT,
			users 			TEXT[],
			reason 			TEXT,
			timestamp 		TEXT
		);

		CREATE TABLE IF NOT EXISTS commands (
			id 				SERIAL PRIMARY KEY,
			server_id 		TEXT,
			name 			TEXT,
			actions 		JSONB,
			target 			TEXT,
			del 			BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS configs (
	    	id 				SERIAL PRIMARY KEY,
	        server_id   	TEXT,
	        banlog_channel	TEXT,
	        ban_message 	TEXT,
	        reprole 		TEXT,
	        delist_channel	TEXT,
	        edit_channel 	TEXT,
	        starboard 		TEXT,
	        blacklist 		TEXT[]
	    );

	    CREATE TABLE IF NOT EXISTS edit_requests (
	    	id 				SERIAL PRIMARY KEY,
	    	host_id 		TEXT,
	    	channel_id		TEXT,
	    	message_id		TEXT,
	    	server_id		TEXT,
	    	user_id			TEXT,
	    	data			JSONB
	    );

	    CREATE TABLE IF NOT EXISTS feedback_configs (
	    	id 				SERIAL PRIMARY KEY,
			server_id		TEXT,
			channel_id		TEXT,
			anon			BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS feedback (
			id				SERIAL PRIMARY KEY,
			hid				TEXT,
			server_id		TEXT,
			sender_id 		TEXT,
			message 		TEXT,
			anon 			BOOLEAN
		);
		
		CREATE TABLE IF NOT EXISTS listing_logs (
			id 				SERIAL PRIMARY KEY,
			hid 			TEXT,
			server_id 		TEXT,
			channel_id 		TEXT,
			message_id 		TEXT,
			server_name 	TEXT,
			reason 			TEXT,
			timestamp 		TEXT,
			type 			BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS posts (
	        id          	SERIAL PRIMARY KEY,
	        host_id 		TEXT,
	        server_id   	TEXT,
	        channel_id  	TEXT,
	        message_id  	TEXT
	    );

	    CREATE TABLE IF NOT EXISTS reactcategories (
	    	id 				SERIAL PRIMARY KEY,
	    	hid 			TEXT,
	    	server_id		TEXT,
	    	name 			TEXT,
	    	description 	TEXT,
	    	roles 			TEXT[],
	    	posts 			TEXT[]
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
			roles			TEXT[],
			page 			INTEGER
		);

		CREATE TABLE IF NOT EXISTS receipts (
			id 				SERIAL PRIMARY KEY,
			hid 			TEXT,
			server_id 		TEXT,
			message			TEXT,
			link			TEXT
		);

		CREATE TABLE IF NOT EXISTS servers (
			id         		SERIAL PRIMARY KEY,
			host_id 		TEXT,
	        server_id   	TEXT,
	        contact_id  	TEXT[],
	        name        	TEXT,
	        description 	TEXT,
	        invite			TEXT,
	        pic_url     	TEXT,
	        color 			TEXT,
	        visibility  	BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS starboards (
			id 				SERIAL PRIMARY KEY,
			server_id 		TEXT,
			channel_id		TEXT,
			emoji			TEXT,
			override		BOOLEAN,
			tolerance		INTEGER
		);

		CREATE TABLE IF NOT EXISTS starred_messages (
			id 				SERIAL PRIMARY KEY,
			server_id		TEXT,
			channel_id		TEXT,
			message_id 		TEXT,
			original_id 	TEXT,
			emoji 			TEXT
		);

		CREATE TABLE IF NOT EXISTS sync (
			id 				SERIAL PRIMARY KEY,
			server_id 		TEXT,
			sync_id 		TEXT,
			confirmed 		BOOLEAN,
			syncable 		BOOLEAN,
			sync_notifs 	TEXT,
			ban_notifs 		TEXT,
			enabled 		BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS sync_menus (
			id 				SERIAL PRIMARY KEY,
			server_id 		TEXT,
			channel_id 		TEXT,
			message_id 		TEXT,
			type 			INTEGER,
			reply_guild 	TEXT,
			reply_channel 	TEXT
		);

		CREATE TABLE IF NOT EXISTS ticket_configs (
			id 				SERIAL PRIMARY KEY,
			server_id		TEXT,
			category_id		TEXT,
			archives_id 	TEXT
		);

		CREATE TABLE IF NOT EXISTS ticket_posts (
			id				SERIAL PRIMARY KEY,
			server_id		TEXT,
			channel_id		TEXT,
			message_id		TEXT
		);

		CREATE TABLE IF NOT EXISTS tickets (
			id 				SERIAL PRIMARY KEY,
			hid 			TEXT,
			server_id 		TEXT,
			channel_id		TEXT,
			first_message 	TEXT,
			opener 			TEXT,
			users 			TEXT[],
			timestamp 		TEXT
		);
	`);
	
	bot.stores = {};
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(["__db.js", "__migrations.js"].includes(file)) continue;
		var tmpname = file.replace(/store\.js/i, "");
		var name =  tmpname[0].toLowerCase() + 
				   (tmpname.endsWith("y") ?
				   	tmpname.slice(1, tmpname.length-1) + "ies" : //ReactCategoryStore.js becomes reactCategories
				    tmpname.slice(1) + "s"); //ProfileStore.js becomes "profiles"

		bot.stores[name] = require(__dirname+'/'+file)(bot, db);
		if(bot.stores[name].init) bot.stores[name].init();
	}

	return db;
}