const { Emoji } = require('discord.js');
Object.getPrototypeOf(require).noCache = function (module) {
  const modKey = this.resolve(module);
  if(Object.prototype.hasOwnProperty.call(this.cache,modKey)) {
    const oldCache = this.cache[modKey];
    delete this.cache[modKey];
    const mod = this(modKey);
    this.cache[modKey] = oldCache;
    return mod;
  } else {
    const mod = this(modKey);
    delete this.cache[modKey];
    return mod;
  }
}

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