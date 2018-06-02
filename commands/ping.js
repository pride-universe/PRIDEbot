const bot = require('../bot.js');

function run (args, context) {
  console.log(bot.servers[context.event.d.guild_id]);
  bot.sendMessage({
    to: context.channelID,
    message: "pong"
  });
}

module.exports = {
  run,
}
