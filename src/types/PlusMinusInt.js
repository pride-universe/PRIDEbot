const Commando = require('discord.js-commando');

class PlusMinusIntegerArgumentType extends Commando.ArgumentType {
  constructor(client) {
    super(client, 'plusminusint');
  }

  async validate(val,) {
    return /^(\+-?|-\+?)?([0-9]{1,3})$/.test(val);
  }

  parse(val) {
    const match = val.match(/^(\+-?|-\+?)?([0-9]{1,3})$/);
    const numval = Number.parseInt(match[2]);
    switch(match[1]) {
    case '-':
      return {up: numval, down: 0};
    case '+':
      return {up: 0, down: numval};
    case '+-':
    case '-+':
    default:
      return {up: numval, down: numval};
    }
  }
}

module.exports = PlusMinusIntegerArgumentType;