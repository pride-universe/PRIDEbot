const { Plugin } = require('discord.js-plugins');
const emoji = new (require('discord.js').Emoji)(null, require('../../../config').twEmoji);
const { dbPromise } = require('../../db');

class TriggerWarnings extends Plugin {
  constructor(client) {
    const info = {
      name: 'triggerwarnings',
      group: 'util',
      description: 'Sends the content of triggerwarnings messages',
      guarded: true
    };
    super(client, info);
  }

  async start() {
    this.client.on('messageReactionAdd', async (reaction, user) => {
      const db = await dbPromise;
      if(user.id === this.client.user.id) return;
      if(reaction.emoji.reactionString !== emoji.reactionString) return;
    
      const message = await db.get('SELECT message_id, text FROM trigger_warnings WHERE message_id = ?', reaction.message.id);
      if(!message) return;
    
      reaction.users.remove(user);
      user.send(message.text);
    });
  }
}

module.exports = TriggerWarnings;