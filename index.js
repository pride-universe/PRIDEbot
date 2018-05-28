const bot = require('./bot.js');
const router = require('./commandRouter.js');

const commands = {
  ping: require('./commands/ping.js'),
}

for (var key in commands) {
    if (commands.hasOwnProperty(key)) {
        router.registerCommand(key, commands[key]);
    }
}
