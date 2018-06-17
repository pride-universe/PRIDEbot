const bot = require('../bot');
const emoji = new (require('discord.js').Emoji)(bot, require('../config').spoilerEmoji);
const db = require('../db');

bot.on("messageReactionAdd", async function (reaction, user) {
  if(user.id === bot.user.id) return;
  if(reaction.emoji.reactionString !== emoji.reactionString) return;

  const message = await db().get('SELECT message_id, text FROM spoilers WHERE message_id = ?', reaction.message.id);
  if(!message) return;

  reaction.users.remove(user);
  user.send(message.text);
});
