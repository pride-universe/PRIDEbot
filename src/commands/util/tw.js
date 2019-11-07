const commando = require('discord.js-commando');
const { stripIndents } = require('common-tags');

module.exports = class TwCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'tw',
      aliases: ['trigger', 'cw'],
      group: 'util',
      memberName: 'tw',
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
      NOTICE: The tw command is deprecated and should not be used.
      ${msg.author} sent a message that may be triggering.
      ${
        subject ? `\n\nSubject of the message is: ${subject}` : ''
      }
      ||${text}||`,
      { reply: null }
    );
    /* eslint-enable indent */
    return null;
  }
};
