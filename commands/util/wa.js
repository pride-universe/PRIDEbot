const commando = require('discord.js-commando');
const { waSecret } = require('../../secrets');
const wolfram = require('wolfram-alpha').createClient(waSecret);

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
      response = await wolfram.query(args);
    } catch (e) {
      msg.channel.stopTyping();
      msg.reply('Error whith connection to WolframAlpha.');
      return;
    }
    response = response.find(e=>e.primary);
    console.log(response);
    if(!response) {
      msg.channel.stopTyping();
      msg.reply('WolframAlpha did not respond with any result.');
      return;
    }
    const title = response.title;
    response = response.subpods.map(e=>e.text).join('\n\n');
    msg.channel.stopTyping();
    msg.reply(`**${title}:**\n${response}`);
  }
};
