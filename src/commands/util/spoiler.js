const commando = require('discord.js-commando');
const { dbPromise } = require('../../db');
const config = require('../../../config');
const { stripIndents } = require('common-tags');
const emoji = new (require('discord.js').Emoji)(null, config.spoilerEmoji);

module.exports = class SpoilerCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'spoiler',
      aliases: ['sp'],
      group: 'util',
      memberName: 'spoiler',
      description: 'Hides the message and require user interaction to view it',
      examples: ['spoiler Oppo created this bot', 'spoiler \\`Creator of Bot` Oppo created this bot'],
      guildOnly: true,
      clientPermissions: ['MANAGE_MESSAGES', 'ADD_REACTIONS'],
      format: '[`subject`] <message>',
    });
  }
  async run(msg, args) {
    await msg.delete();
    const db = await dbPromise;
    const match = args.match(/\s*(?:(``?)(.*?)\1)?\s*(.*)/);
    const subject = match[2];
    const text = match[3];
    /* eslint-disable indent */
    const response = await msg.channel.send(
      stripIndents`
      ${msg.author} sent a spoiler.
      Click ${emoji} to have the message sent in PM ${
        subject ? `\n\nSubject of the spoiler is: ${subject}` : ''
      }`,
      { reply: null }
    );
    /* eslint-enable indent */
    db.run('INSERT INTO spoilers (message_id, text) VALUES (?, ?)', response.id, text);

    await response.react(emoji.reactionString);
    return null;
  }
};
