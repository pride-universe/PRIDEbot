const { Plugin } = require('discord.js-plugins');
const { Util } = require('discord.js');

class ChannelInfo extends Plugin {
  constructor(client) {
    const info = {
      name: 'channelInfo',
      group: 'util',
      description: 'Keeps a registry of channels and channel topics',
      guarded: false,
      autostart: true,
      startOn: ['ready', 'providerReady']
    };
    super(client, info);
  }

  async start() {
    this.client.on('channelCreate', (...args) => this.refreshChannelList(...args));
    this.client.on('channelUpdate', (...args) => this.refreshChannelList(...args));
  }

  /**
   * 
   * @param {import("discord.js").GuildChannel} channel 
   * @param {import("discord.js").GuildChannel} newChannel 
   */
  async refreshChannelList(channel) {
    if(!channel.guild) return;
    /**
     * @type {import("discord.js-commando").CommandoGuild}
     */
    const guild = channel.guild;
    /**
     * @type {import("discord.js").TextChannel}
     */
    const channelList = guild.channels.resolve(guild.settings.get('channelListChannel'));
    if(!channelList) return;
    const memberRoles = guild.settings.get('permissionRoles', {}).members;
    const [roots, children] = guild.channels.cache.filter(
      ch=>{
        if(!memberRoles) return true;
        if (ch.type === 'category') return true;
        if (ch.type !== 'text') return false;
        return memberRoles.find((id)=>ch.permissionsFor(id) && ch.permissionsFor(id).has('VIEW_CHANNEL'));
      }
    ).partition(ch=>!ch.parent).map(col=>Util.discordSort(col));
    const text = roots.map(ch=>({channel: ch, children: children.filter(child=>child.parentID === ch.id)})).filter(root=>root.channel.type==='category' && root.children.size).map(root=>{
      if(root.channel.type === 'category') {
        // eslint-disable-next-line no-irregular-whitespace
        return root.channel.name.toUpperCase() + root.children.map(child=>`\n​  ${child.toString()}${child.topic?' - ' + child.topic:''}`).join('');
      }
      return `${root.channel.toString()}${root.channel.topic?' - ' + root.channel.topic:''}`;
    }).join('\n\n');
    let newContent = Util.splitMessage(text);
    if(typeof newContent === 'string') newContent = [newContent];
    let oldMessages = (await channelList.messages.fetch()).cache.filter(msg=>msg.author.id === this.client.user.id);
    if(oldMessages.size < newContent.length) {
      oldMessages.forEach(msg=>msg.delete());
      oldMessages = null;
    }
    while(oldMessages && oldMessages.size > newContent.length) {
      oldMessages.first().delete();
      oldMessages.delete(oldMessages.firstKey());
    }
    if(oldMessages) {
      oldMessages.array().reverse().forEach((msg,i)=>msg.edit(newContent[i]));
    } else {
      for(let txt of newContent) {
        await channelList.send(txt);
      }
    }
  }
}

module.exports = ChannelInfo;