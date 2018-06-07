const bot = require('../bot.js');
const config = require('../config.json');

function shortInfo(command) {
  return "Responds with pong";
}

function helpString(command) {
  let help = "Responds with pong";
  help += "\nSyntax `"+config.prefix[0]+command+"`";
  return help
}

function run (args, context) {
  bot.sendMessage({
    to: context.channelID,
    message: "pong"
  });
}

module.exports = {
  run,
  shortInfo,
  helpString,
}
