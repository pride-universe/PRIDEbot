const bot = require('../bot.js');

function run (args, context) {
  console.log(context);
  bot.sendMessage({
    to: context.channelID,
    message: "pong"
  });
}

module.exports = {
  run,
}
