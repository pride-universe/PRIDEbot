const bot = require('../bot.js');
const commandRouter = require('../commandRouter.js');
const config = require('../config.json');

function shortInfo(command) {
  return "Shows help about a given command";
}

function helpString(command) {
  let help = "Shows help about a command. To get a list of commands, type `" + config.prefix + "commands`";
  help += "\nSyntax `"+config.prefix+command+" [command]`";
  return help
}

function run (args, context) {
  let command, commandObj;

  try {
    if(args.length == 2){
      let res = commandRouter.findCommand(args[1]);
      command = res.command;
      commandObj = res.commandObj;
    } else {
      let res = commandRouter.findCommand(args[0]);
      command = res.command;
      commandObj = res.commandObj;
    }
  } catch (err) {
    bot.sendMessage({
      to: context.channelID,
      message: "Unable to find command",
    });
    return;
  }

  try {
    helpStr = commandObj.helpString(command);
  } catch (err) {
    console.error(err);
    helpStr = "No help available for "+command;
  }

  let aliases = commandRouter.listAliases(command);

  if(aliases.length > 0) {
    aliases = aliases.map(a => "`"+config.prefix+a+"`");
    helpStr += "\n\nAliases: "+aliases.join(", ");
  }

  bot.sendMessage({
    to: context.channelID,
    message: helpStr,
  });
}

module.exports = {
  run,
  shortInfo,
  helpString,
}
