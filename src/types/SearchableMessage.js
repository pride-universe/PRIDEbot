const Commando = require('discord.js-commando');
const CACHE_SIZE = 10;
class SearchableMessageArgumentType extends Commando.ArgumentType {
  constructor(client) {
    super(client, 'searchablemessage');
    this._cache = new Array(CACHE_SIZE);
    this._cacheIndex = 0;
  }

  cache(message) {
    this._cache[this._cacheIndex] = message;
    this._cacheIndex = (this._cacheIndex + 1) % CACHE_SIZE;
  }

  async search(val, msg, isParsing) {
    const match = val.match(/^(?:https:\/\/discordapp.com\/channels\/[0-9]+\/)?(?:([0-9]+)\/)?([0-9]+)$/);
    if(!match) return false;
    if(!match[1] && match[2] <= 1000) return false;
    const cacheHit = this._cache.find(m=>m && m.id === match[2]);
    if(cacheHit) return cacheHit;
    if(isParsing) this.client.emit('warn', 'Researching for message in parse function.');
    if(match[1]) {
      const guild = this.client.guilds.find(guild=>guild.channels.has(match[1]));
      if(!guild) return 'Cannot find provided channel';
      const channel = guild.channels.get(match[1]);
      if (channel.type !== 'text') return 'Provided channel is not text channel';
      const message = await channel.messages.fetch(match[2]).catch(()=>null);
      if(!message) return 'Cannot find message in channel';
      this.cache(message);
      return message;
    } else {
      let message;
      msg.channel.startTyping();
      try {
        search: for(let [,guild] of this.client.guilds) {
          for(let [,channel] of guild.channels) {
            if(channel.type !== 'text') continue;
            message = await channel.messages.fetch(match[2]).catch(()=>null);
            if(message) break search;
          }
        }
      } catch (err) {
        console.log(err);
      } finally {
        msg.channel.stopTyping();
      }
      if(message) {
        this.cache(message);
        return message;
      }
    }
    return 'Cannot find message';
  }

  async validate(val, msg) {
    if(msg.targetChannel && msg.targetMessage) return true;
    const found = await this.search(val, msg);
    if(typeof found !== 'object') return found;
    return true;
  }

  async parse(val, msg) {
    const retobj = await this.search(val, msg, true);
    if(typeof retobj !== 'object') return null;
    return retobj;
  }
}

module.exports = SearchableMessageArgumentType;