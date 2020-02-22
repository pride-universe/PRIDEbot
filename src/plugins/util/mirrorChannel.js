const { Plugin } = require('discord.js-plugins');
const { MessageEmbed } = require('discord.js');

const MESSAGE_BUFFER = 100;

class MirrorChannel extends Plugin {
  constructor(client) {
    const info = {
      name: 'mirrorChannel',
      group: 'util',
      description: 'Mirrors a channel to another on a server',
      guarded: false,
      autostart: false,
      startOn: ['ready', 'providerReady']
    };
    super(client, info);
  }

  async start() {
    this.client.on('message', (...args) => this.onMessage(...args));
    this.client.on('messageDelete', (...args) => this.onMessageDelete(...args));
    this.client.on('messageUpdate', (...args) => this.onMessageUpdate(...args));
    for(const [,guild] of this.client.guilds.cache) {
      const mirrorChannels = guild.settings.get('mirrorChannels');
      if(!mirrorChannels) continue;
      for(const mirror of mirrorChannels) {
        const source = guild.channels.resolve(mirror[0]);
        const target = guild.channels.resolve(mirror[1]);
        if(!source || !target) continue;
        source.messages.fetch({limit: MESSAGE_BUFFER});
        target.messages.fetch({limit: MESSAGE_BUFFER});
      }
    }
  }
  
  createEmbed(message) {
    return new MessageEmbed()
      .setColor(0x3B88C3)
      .setAuthor(message.author.tag, message.author.avatarURL())
      .setDescription(message.content);
  }

  async onMessage(message) {
    if(!message.member) return;
    if(message.author.bot) return;
    if(!message.guild) return;
    const guild = message.guild;
    const mirrorChannels = guild.settings.get('mirrorChannels');
    if(!mirrorChannels) return;
    const mirror = mirrorChannels.find(e=>e[0]===message.channel.id);
    if(!mirror) return;
    const targetChannel = guild.channels.resolve(mirror[1]);
    if(!targetChannel) return;
    const mirrorMessages = guild.settings.get('mirrorMessages', {});
    const targetMessage = await targetChannel.send({embed: this.createEmbed(message)});
    if(!Object.prototype.hasOwnProperty.call(mirrorMessages, message.channel.id)) {
      mirrorMessages[message.channel.id] = [];
    }
    mirrorMessages[message.channel.id].push([message.id, targetMessage.id]);
    mirrorMessages[message.channel.id].splice(0,mirrorMessages[message.channel.id].length-MESSAGE_BUFFER);
    guild.settings.set('mirrorMessages', mirrorMessages);
  }

  async onMessageDelete(message) {
    if(!message.member) return;
    if(!message.guild) return;
    const guild = message.guild;
    const mirrorChannels = guild.settings.get('mirrorChannels');
    if(!mirrorChannels) return;
    const mirror = mirrorChannels.find(e=>e[0]===message.channel.id);
    if(!mirror) return;
    const targetChannel = guild.channels.resolve(mirror[1]);
    if(!targetChannel) return;
    const mirrorMessages = guild.settings.get('mirrorMessages', {});
    if(!Object.prototype.hasOwnProperty.call(mirrorMessages, message.channel.id)) return;
    const targetIndex = mirrorMessages[message.channel.id].findIndex(e=>e[0] === message.id);
    if(targetIndex === -1) return;
    const targetMessage = targetChannel.messages.get(mirrorMessages[message.channel.id][targetIndex][1]);
    if(!targetMessage) return;
    mirrorMessages[message.channel.id].splice(targetIndex, 1);
    guild.settings.set('mirrorMessages', mirrorMessages);
    targetMessage.delete();
  }

  async onMessageUpdate(oldMessage, newMessage) {
    if(!oldMessage.member) return;
    if(!oldMessage.guild) return;
    const guild = oldMessage.guild;
    const mirrorChannels = guild.settings.get('mirrorChannels');
    if(!mirrorChannels) return;
    const mirror = mirrorChannels.find(e=>e[0]===oldMessage.channel.id);
    if(!mirror) return;
    const targetChannel = guild.channels.resolve(mirror[1]);
    if(!targetChannel) return;
    const mirrorMessages = guild.settings.get('mirrorMessages', {});
    if(!Object.prototype.hasOwnProperty.call(mirrorMessages, oldMessage.channel.id)) return;
    
    const targetMessage = targetChannel.messages.get(mirrorMessages[oldMessage.channel.id].find(e=>e[0] === oldMessage.id)[1]);
    if(!targetMessage) return;
    targetMessage.edit({embed: this.createEmbed(newMessage)});
  }
}

module.exports = MirrorChannel;