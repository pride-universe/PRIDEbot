const { Emoji } = require('discord.js');

Object.defineProperty(Emoji.prototype, "reactionString", {
  get () {
    return this.id || this.name;
  }
});
