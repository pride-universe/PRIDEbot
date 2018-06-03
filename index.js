const bot = require('./bot.js');
const router = require('./commandRouter.js');
const repl = require('repl');

const commands = {
  ping: require('./commands/ping.js'),
  tw: require('./commands/tw.js'),
  spoiler: require('./commands/spoiler.js'),
}

for (var command in commands) {
    if (commands.hasOwnProperty(command)) {
        router.registerCommand(command, commands[command]);
    }
}

repl.start('> ').context.bot = bot;
