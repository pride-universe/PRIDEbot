CREATE TABLE IF NOT EXISTS "roles" (
	`id`	INTEGER NOT NULL,
	`name`	TEXT NOT NULL UNIQUE,
	`permissions`	TEXT NOT NULL,
	PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS "settings" (
	`guild` INTEGER,
	`settings` TEXT,
	PRIMARY KEY(`guild`)
);
CREATE TABLE IF NOT EXISTS "jokes" (
	`identifier`	TEXT UNIQUE,
	`value`	TEXT,
	PRIMARY KEY(`identifier`)
);
CREATE TABLE IF NOT EXISTS "users" (
	`user`	TEXT UNIQUE,
	`data`	TEXT,
	PRIMARY KEY(`user`)
);
CREATE TABLE IF NOT EXISTS "trigger_warnings" (
	`message_id` TEXT UNIQUE,
	`text` TEXT,
	PRIMARY KEY(`message_id`)
);
CREATE TABLE IF NOT EXISTS "spoilers" (
	`message_id` TEXT UNIQUE,
	`text` TEXT,
	PRIMARY KEY(`message_id`)
);
