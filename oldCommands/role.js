const bot = require('../bot.js');
const config = require('../config.json');

function shortInfo(command) {
  return "Toggles roles for your account";
}

function helpString(command) {
  let help = "Toggles roles for your account";
  help += "\nSyntax `"+config.prefix[0]+command+" <role|'list'>`";
  help += "\nSyntax `"+config.prefix[0]+command+" <role|'list'>`";
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
