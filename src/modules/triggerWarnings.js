const client = require('../index');
const emoji = new (require('discord.js').Emoji)(client, require('../../config').twEmoji);
const { dbPromise } = require('../db');

client.on('messageReactionAdd', async function (reaction, user) {
  const db = await dbPromise;
  if(user.id === client.user.id) return;
  if(reaction.emoji.reactionString !== emoji.reactionString) return;

  const message = await db.get('SELECT message_id, text FROM trigger_warnings WHERE message_id = ?', reaction.message.id);
  if(!message) return;

  reaction.users.remove(user);
  user.send(message.text);
});
