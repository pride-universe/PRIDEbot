const bot = require('./bot.js');
const router = require('./commandRouter.js');
const sqlite = require('sqlite');
const repl = require('repl');

const commands = {
  ping: require('./commands/ping.js'),
  tw: require('./commands/tw.js'),
}

for (var command in commands) {
    if (commands.hasOwnProperty(command)) {
        router.registerCommand(command, commands[command]);
    }
}

async function initDB () {
  const db = await sqlite.open('./main.sqlite', { Promise });
}
initDB();

repl.start('> ').context.bot = bot;
