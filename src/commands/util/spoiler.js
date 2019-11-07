const commando = require('discord.js-commando');
const { stripIndents } = require('common-tags');

module.exports = class SpoilerCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'spoiler',
      aliases: ['sp'],
      group: 'util',
      memberName: 'spoiler',
      description: 'DEPRECATED, PLEASE DO NOT USE!\nUse the discord spoiler feature to hide text instead `||TEXT TO HIDE||`',
      guildOnly: true,
      clientPermissions: ['MANAGE_MESSAGES', 'ADD_REACTIONS'],
    });
  }
  async run(msg, args) {
    await msg.delete();
    const match = args.match(/\s*(?:(``?|;)(.*?)\1)?\s*([\s\S]*)/);
    const subject = match[2];
    const text = match[3];
    /* eslint-disable indent */
    msg.channel.send(
      stripIndents`
      NOTICE: The spoiler command is deprecated and should not be used.
      ${msg.author} sent a spoiler.
      ${
        subject ? `\n\nSubject of the spoiler is: ${subject}` : ''
      }
      ||${text}||`,
      { reply: null }
    );
    /* eslint-enable indent */
  }
};
