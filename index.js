const bot = require('./bot.js');
const router = require('./commandRouter.js');

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

if(!process.argv.find((e)=>e==="--no-repl")) {
  const repl = require('repl');
  repl.start('> ').context.bot = bot;
}
