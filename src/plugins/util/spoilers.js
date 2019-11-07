const { Plugin } = require('discord.js-plugins');
const emoji = new (require('discord.js').Emoji)(null, require('../../../config').spoilerEmoji);
const db = require('../../db');

const select = db.prepare('SELECT message_id, text FROM spoilers WHERE message_id = ?');

class Spoiler extends Plugin {
  constructor(client) {
    const info = {
      name: 'spoilers',
      group: 'util',
      description: 'Sends the content of spoiler messages',
      guarded: true
    };
    super(client, info);
  }

  async start() {
    this.client.on('messageReactionAdd', (reaction, user) => {
      if(user.id === this.client.user.id) return;
      if(reaction.emoji.reactionString !== emoji.reactionString) return;
    
      const message = select.get(reaction.message.id);
      if(!message) return;
    
      reaction.users.remove(user);
      user.send(message.text);
    });
  }
}

module.exports = Spoiler;