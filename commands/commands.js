const bot = require('../bot.js');
const commandRouter = require('../commandRouter.js');
const config = require('../config.json');

function shortInfo(command) {
  return "Lists all commands";
}

function helpString(command) {
  let help = "Lists all commands";
  help += "\nSyntax `"+config.prefix[0]+command+"`";
  return help
}

function run (args, context) {
  const commands = commandRouter.commands;
  let commandsBlock = "```\n";

  for(let command in commands) {
    let shortInfo;
    try {
      shortInfo = commands[command].shortInfo();
    } catch (err) {
      shortInfo = "[NO INFO AVAILABLE]";
    }
    commandsBlock += config.prefix[0]+command+": "+shortInfo+"\n";
  }

  commandsBlock += "```"
  bot.sendMessage({
    to: context.channelID,
    message: "Here's a list of all commands:\n"+commandsBlock,
  });
}

module.exports = {
  run,
  shortInfo,
  helpString,
}
