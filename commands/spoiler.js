const bot = require('../bot.js');
const db = require('../db.js');
const config = require('../config.json');
const { emojiToString, emojiToReaction, emojiCompare } = require('../utils.js');
const emoji = config.spoilerEmoji;

bot.on("messageReactionAdd", event => {
  console.log(event);
  if(!emojiCompare(event.d.emoji, emoji) || event.d.user_id === bot.id) return;
  db().get('SELECT message_id, text FROM spoilers WHERE message_id = ?', event.d.message_id)
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
    }, console.log);
  })
});

function run (args, context) {
  //console.log(context);
  message = context.message;
  if(message.indexOf(" ") === -1) {
    bot.sendMessage({
      to: context.channelID,
      message: "<@"+context.userID+"> Error, you did not include any message with your spoiler.",
    });
    return;
  }

  message = message.substr(message.indexOf(" ") + 1);

  let subject = null;
  const matches = message.match(/\`([^\`]+)\` (.*)/);

  if(matches) {
    subject = matches[1];
    message = matches[2];
  }

  let resMsg = "<@"+context.userID+"> sent a spoiler. Click "+emojiToString(emoji)+" to have the message sent in PM"
  if(subject) {
    resMsg += "\nThe subject of the spoiler is: "+subject;
  }
  bot.deleteMessage({channelID: context.channelID, messageID: context.event.d.id });
  bot.sendMessage({
    to: context.channelID,
    message: resMsg,
  }, (err, res) => {
    console.log(err, res);
    if(err) {
      console.error("Error when posting spoiler message.");
      return;
    }

    bot.addReaction({
      channelID: res.channel_id,
      messageID: res.id,
      reaction: emojiToReaction(emoji),
    });
    db().run("INSERT INTO spoilers (message_id, text) VALUES (?, ?)", res.id, message);
  });
}

module.exports = {
  run,
}
