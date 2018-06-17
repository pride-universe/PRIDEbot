const commando = require('discord.js-commando');
const path = require('path');
const oneLine = require('common-tags').oneLine;
const token = require('./secrets').discordToken;
const db = require('./db');
const config = require('./config');

const bot = new commando.Client({
	owner: config.owners,
	commandPrefix: config.prefix,
});

bot
  .on('error', console.error)
  .on('warn', console.warn)
  .on('debug', console.log)
  .on('ready', () => {
		console.log(`Client ready; logged in as ${bot.user.username}#${bot.user.discriminator} - (${bot.user.id})`);
	})
  .on('disconnect', () => { console.warn('Disconnected!'); })
  .on('reconnecting', () => { console.warn('Reconnecting...'); })
  .on('commandError', (cmd, err) => {
    if(err instanceof commando.FriendlyError) return;
    console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
  })
  .on('commandBlocked', (msg, reason) => {
    console.log(oneLine`
      Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
      blocked; ${reason}
    `);
  })
  .on('commandPrefixChange', (guild, prefix) => {
    console.log(oneLine`
      Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
      ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
    `);
  })
  .on('commandStatusChange', (guild, command, enabled) => {
    console.log(oneLine`
      Command ${command.groupID}:${command.memberName}
      ${enabled ? 'enabled' : 'disabled'}
      ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
    `);
  })
  .on('groupStatusChange', (guild, group, enabled) => {
    console.log(oneLine`
      Group ${group.id}
      ${enabled ? 'enabled' : 'disabled'}
      ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
    `);
  });

bot.setProvider(
	db.awaitDb().then(db => new commando.SQLiteProvider(db))
).catch(console.error);

bot.registry
	.registerGroup('math', 'Math')
  .registerDefaultTypes()
  .registerDefaultGroups()
	.registerDefaultCommands({
    'prefix': false,
  })
  .registerTypesIn(path.join(__dirname, 'types'))
  .registerCommandsIn(path.join(__dirname, 'commands'));;

bot.login(token);

module.exports = bot;
