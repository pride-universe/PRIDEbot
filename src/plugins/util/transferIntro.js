const { Plugin } = require('discord.js-plugins');
const { MessageEmbed } = require('discord.js');

const TIME_LIMIT = 86400000;

class TransferIntro extends Plugin {
  constructor(client) {
    const info = {
      name: 'transferIntro',
      group: 'util',
      description: 'Mirrors a channel to another on a server',
      guarded: false,
      startOn: ['ready', 'providerReady']
    };
    super(client, info);
  }

  async start() {
    this.client.on('guildMemberUpdate', (...args) => this.onGuildMemberUpdate(...args));
    for(const [,guild] of this.client.guilds.cache) {
      const introChannels = guild.settings.get('introChannels');
      if(!introChannels) continue;
      const source = guild.channels.resolve(introChannels[0]);
      if(!source) continue;
      source.messages.fetch({limit: 100});
      guild.members.fetch();
    }
  }
  
  createEmbed(message) {
    const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${message.author.discriminator % 5}.png`;
    return new MessageEmbed()
      .setColor(0x3B88C3)
      .setAuthor(message.author.tag, message.author.avatarURL() || defaultAvatar)
      .setDescription(message.content);
  }

  async onGuildMemberUpdate(oldMember, newMember) {
    if(oldMember.user.bot) return;
    const guild = oldMember.guild;
    if(!guild) return;
    const noRole = guild.settings.get('noRole');
    if(!noRole) return;
    if(!oldMember.roles.cache.has(noRole) || newMember.roles.cache.has(noRole)) return;
    const introChannels = guild.settings.get('introChannels');
    if(!introChannels || !Array.isArray(introChannels)) return;
    const sourceChannel = guild.channels.resolve(introChannels[0]);
    const targetChannel = guild.channels.resolve(introChannels[1]);
    if(!sourceChannel || !targetChannel) return;
    try {
      const now = new Date().getTime();
      const messages = (await sourceChannel.messages.fetch()).filter(e => now - e.createdAt.getTime() < TIME_LIMIT && e.author.id === oldMember.id);
      for(const [,message] of messages) {
        await targetChannel.send({embed: this.createEmbed(message)});
      }
    } catch (err) {
      console.log(err);
      this.client.emit('warn', `Missing permissions to transfer intro in server ${guild.name}`);
    }
  }
}

module.exports = TransferIntro;