const commando = require('discord.js-commando');
const waSecret = process.env.WA_SECRET;
const wolfram = require('@dguttman/wolfram-alpha-api')(waSecret);

module.exports = class WaCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'wa',
      aliases: ['wolfram', 'wolframalpha'],
      group: 'util',
      memberName: 'wa',
      description: 'Does math calculations using Wolfram Alpha',
      examples: ['wa distance from the sun to earth', 'wa 1 liter in oz'],
      guildOnly: false,
      clientPermissions: [],
      format: '<query>',
    });
  }
  async run(msg, args) {
    msg.channel.startTyping();
    let response;
    try {
      response = await wolfram.getShort(args);
    } catch (e) {
      console.error(e);
      msg.channel.stopTyping();
      return msg.reply(e.message);
    }
    if(!response) {
      msg.channel.stopTyping();
      return msg.reply('WolframAlpha did not respond with any result.');
    }
    msg.channel.stopTyping();
    return msg.reply(`${response}`);
  }
};
