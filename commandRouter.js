const commands = {};
const aliases = require('./aliases.json');

function route (command, args, context) {
  if (aliases.hasOwnProperty(command)) {
    command = aliases[command];
  }
  commandObj = commands[command];
  if (commandObj && typeof commandObj.run === "function") {
    commandObj.run(args, context);
  }
}

function registerCommand(command, commandObj) {
  commands[command] = commandObj;
}

function registerAlias(alias, command) {
  aliases[alias] = command;
}

module.exports = {
  route,
  registerCommand,
  registerAlias,
}
