const bot = require('../bot.js');
const db = require('../db.js');
const config = require('../config.json');
const { emojiToString, emojiToReaction, emojiCompare } = require('../utils.js');
const emoji = config.twEmoji;

function shortInfo(command) {
  return "Sends a message with a trigger warning and hides the message";
}

function helpString(command) {
  let help = "Hides the message and require user interaction to view it";
  help += "\nSyntax `"+config.prefix[0]+command+" <message>`";
  return help
}

bot.on("messageReactionAdd", event => {
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
});

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

module.exports = {
  run,
  shortInfo,
  helpString,
}
