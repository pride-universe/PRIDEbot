const { Plugin } = require('discord.js-plugins');
const { MessageEmbed } = require('discord.js');
const { servers } = require('../../../config');
const commando = require('discord.js-commando');
const MESSAGE_BUFFER = 100;

class ChannelNotFoundError extends Error {}

class MirrorChannel extends Plugin {
  constructor(client) {
    const info = {
      name: 'deletedLog',
      group: 'util',
      description: 'Logs edited and deleted messages',
      guarded: false,
      autostart: true,
      startOn: ['ready', 'providerReady']
    };
    super(client, info);
    this.guilds = {};
    for(let name in servers) {
      const server = servers[name];
      if(!server.deletedOutput) continue;
      this.guilds[server.id] = server.deletedOutput;
    }
    this.history = {};
  }

  async clear() {
    this.client.emit('warn', 'TODO CLEAR THE OUTPUT CHANNEL');
  }

  async start() {
    this.client.on('messageDelete', (...args) => this.onMessageDelete(...args));
    this.client.on('messageUpdate', (...args) => this.onMessageUpdate(...args));
    this.interval = this.client.setInterval(()=>this.clear(), 3600000);
  }

  async stop() {
    this.client.clearInterval(this.interval);
  }

  createEmbed(message) {
    const embed = new MessageEmbed()
      .setColor(message.member.displayColor)
      .setAuthor(message.author.tag, message.author.avatarURL())
      .setDescription(message.content);
    if(this.history[message.id]) {
      embed.setTitle('Final message');
      for(let i = this.history[message.id].length - 1; i >= 0; i--) {
        embed.addField(i === 0 ? 'Original Message' : 'Prior Edit', this.history[message.id][i].substr(0, 1024));
      }
    }
    return embed;
  }

  async onMessageDelete(message) {
    if(!message.member) return;
    if(message.author.bot) return;
    if(!message.guild || !this.guilds[message.guild.id]) return;
    const deleteWindow = message.guild.settings.get('deleteWindow');
    if(!deleteWindow) return;
    if(Date.now() - message.createdAt > deleteWindow) return;
    const guild = message.guild;
    let outputChannel
    try {
      outputChannel = this.client.guilds.get(this.guilds[guild.id][0]).channels.get(this.guilds[guild.id][1]);
      if(!outputChannel) throw new ChannelNotFoundError("Cannot find the channel specified");
    } catch (err) {
      this.client.emit('error', err);
      return;
    }
    const contextMessage = (await message.channel.messages.fetch({before: message.id, limit: 1})).first();
    
    outputChannel.send(contextMessage ? `Message was after: https://discordapp.com/channels/${contextMessage.guild.id}/${contextMessage.channel.id}/${contextMessage.id}` : null
      , {embed: this.createEmbed(message)});
  }

  async onMessageUpdate(message) {
    if(!message.member) return;
    if(message.author.bot) return;
    if(!message.guild || !this.guilds[message.guild.id]) return;
    const deleteWindow = message.guild.settings.get('deleteWindow');
    if(!deleteWindow) return;
    this.history[message.id] = (this.history[message.id]||[]);
    this.history[message.id].push(message.content);
    this.client.setTimeout(id=>delete this.history[id], deleteWindow + 5000, message.id);
  }
}

module.exports = MirrorChannel;