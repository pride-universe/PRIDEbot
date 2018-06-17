const bot = require('../bot');
const emoji = require('../config').twEmoji;
const db = require('../db');

bot.on("messageReactionAdd", (reaction, user) => {
  if(user.id === bot.user.id) return;
  reaction.remove(user);
  console.log(reaction.emoji);
  /*
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
  })*/
});
