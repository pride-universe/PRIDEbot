const commando = require('discord.js-commando');

module.exports = class BoopCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'boop',
      aliases: [],
      group: 'jokes',
      memberName: 'boop',
      description: 'Boop the bot',
      examples: ['boop'],
      guildOnly: false,
      clientPermissions: [],
      format: '',
    });
  }
  run(msg) {
    msg.reply('Woof!');
  }
};
