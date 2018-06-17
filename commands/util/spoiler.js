const bot = require('../../bot');
const commando = require('discord.js-commando');
const db = require('../../db');
const config = require('../../config');
const { stripIndents, oneLine } = require('common-tags');
const emoji = new (require('discord.js').Emoji)(bot, config.spoilerEmoji);

module.exports = class TwCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'spoiler',
      aliases: [],
      group: 'util',
      memberName: 'spoiler',
      description: 'Hides the message and require user interaction to view it',
      examples: ['spoiler Oppo created this bot', 'spoiler \\`Creator of Bot` Oppo created this bot'],
      guildOnly: true,
      defaultHandling: true,
      format: '[`subject`] <message>',
    });
  }
  async run(msg, args) {
    await msg.delete();
    const match = args.match(/\s*(?:(``?)(.*?)\1)?\s*(.*)/);
    const subject = match[2];
    const text = match[3];

    const response = await msg.channel.send(
      stripIndents`
      ${msg.author} sent a spoiler.
      Click ${emoji} to have the message sent in PM ${
        subject ? `\n\nSubject of the spoiler is: ${subject}` : ''
      }`,
      { reply: null }
    );

    db().run("INSERT INTO spoilers (message_id, text) VALUES (?, ?)", response.id, text);

    await response.react(emoji.reactionString);
  }
};

/*
module.exports = {
  run,
  shortInfo,
  helpString,
}*/
