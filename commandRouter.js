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

function findCommand(command) {
  if (aliases.hasOwnProperty(command)) {
    command = aliases[command];
  }
  commandObj = commands[command];
  if (commandObj) {
    return {command, commandObj};
  }
  throw new Error('Unable to find that command');
}

function listAliases(command) {
  let list = [];
  for(let alias in aliases) {
    if (aliases[alias] === command) {
      list.push(alias);
    }
  }
  return list;
}

module.exports = {
  route,
  registerCommand,
  registerAlias,
  findCommand,
  listAliases,
  commands,
}
