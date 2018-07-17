const { Emoji } = require('discord.js');

Object.defineProperty(Emoji.prototype, 'reactionString', {
  get () {
    return this.id || this.name;
  }
});

if(!Math.clamp) {
  Math.clamp = function clamp(x, lower, upper) {
    return Math.max(lower, Math.min(x, upper));
  };
}