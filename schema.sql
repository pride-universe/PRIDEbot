BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS `trigger_warnings` (
	`id`	INTEGER,
	`message_id`	TEXT UNIQUE,
	`text`	TEXT,
	PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `spoilers` (
	`id`	INTEGER PRIMARY KEY AUTOINCREMENT,
	`message_id`	TEXT UNIQUE,
	`text`	INTEGER
);
CREATE TABLE IF NOT EXISTS `settings` (
	`guild`	INTEGER,
	`settings`	TEXT,
	PRIMARY KEY(`guild`)
);
CREATE TABLE IF NOT EXISTS `roles` (
	`id`	INTEGER NOT NULL,
	`name`	TEXT NOT NULL UNIQUE,
	`permissions`	TEXT NOT NULL,
	PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `jokes` (
	`identifier`	TEXT UNIQUE,
	`value`	TEXT,
	PRIMARY KEY(`identifier`)
);
COMMIT;
