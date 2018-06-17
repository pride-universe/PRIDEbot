const bot = require('../../bot');
const commando = require('discord.js-commando');
const db = require('../../db');
const config = require('../../config');
const { emojiToString, emojiToReaction, emojiCompare } = require('../../utils');
const { stripIndents, oneLine } = require('common-tags');

const emoji = config.twEmoji;

/*bot.on("messageReactionAdd", event => {
  if(!emojiCompare(event.d.emoji, emoji) || event.d.user_id === bot.id) return;
  db().get('SELECT message_id, text FROM trigger_warnings WHERE message_id = ?', event.d.message_id)
  .then(res => {
    if(!res) return;
    bot.removeReaction({
      channelID: event.d.channel_id,
      messageID: event.d.message_id,
      userID: event.d.user_id,
      reaction: emojiToReaction(emoji),
    });
    bot.sendMessage({
      to: event.d.user_id,
      message: res.text,
    });
  })
});*/

function run (args, context) {
  message = context.message;
  if(message.indexOf(" ") === -1) {
    bot.sendMessage({
      to: context.channelID,
      message: "<@"+context.userID+"> Error, you did not include any message with your trigger warning.",
    });
    return;
  }
  message = message.substr(message.indexOf(" ") + 1);
  bot.deleteMessage({channelID: context.channelID, messageID: context.event.d.id });
  bot.sendMessage({
    to: context.channelID,
    message: "<@"+context.userID+"> sent a message that may be triggering. Click "+emojiToString(emoji)+" to have the message sent in PM",
  }, (err, res) => {

    if(err) {
      console.error("Error when posting TW message.");
      return;
    }

    bot.addReaction({
      channelID: res.channel_id,
      messageID: res.id,
      reaction: emojiToReaction(emoji),
    });
    db().run("INSERT INTO trigger_warnings (message_id, text) VALUES (?, ?)", res.id, message);
  });
}

module.exports = class TwCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'tw',
      aliases: ['trigger', 'cw'],
      group: 'util',
      memberName: 'tw',
      description: 'Hides the message and require user interaction to view it',
      examples: ['tw I stubbed my toe on a table', 'tw \\`physical harm` I stubbed my toe on a table'],
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

    db().run("INSERT INTO trigger_warnings (message_id, text) VALUES (?, ?)", msg.id, text);

    const response = await msg.channel.send(
      stripIndents`
      ${msg.author} sent a message that may be triggering.
      Click ${emojiToString(emoji)} to have the message sent in PM ${
        subject ? `\n\nSubject of the message is: ${subject}` : ''
      }`,
      { reply: null }
    );
    await response.react(emojiToReaction(emoji));
  }
};

/*
module.exports = {
  run,
  shortInfo,
  helpString,
}*/
