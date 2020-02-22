const { Plugin } = require('discord.js-plugins');
const { VoiceChannel } = require('discord.js');
const { oneLine } = require('common-tags');
const { FriendlyError } = require('discord.js-commando');
const { getProp } = require('../../modules/userData');

class VoicePrivacyPlugin extends Plugin {
  constructor(client) {
    const info = {
      name: 'voiceprivacy',
      group: 'privacy',
      description: 'Ensures user privacy in voice channels',
      details: 'Prevents the bot from coexisting in voice channels where users who have requested the bot to stay away are present',
      guarded: true
    };
    super(client, info);
    this.originalJoin = VoiceChannel.prototype.join;
  }

  async start() {
    const self = this;
    VoiceChannel.prototype.join = async function join(...args) {
      if(await self.checkChannel(this)) {
        return await self.originalJoin.apply(this, args);
      } else {
        throw new FriendlyError(oneLine`
        There are unmuted users who have requested to not have me in the same voice channel as them in the channel you're trying to get me to join.
        I cannot join until they have muted themselves or left. Please don't try to force any user to leave or mute, their privacy, right to feel
        safe and right to partake in this community is more important than whatever you're trying to get me to do!`);
      }
    };
    this.client.on('voiceStateUpdate', (oldMember, newMember) => {
      this.parseVoiceUpdate(newMember);
    });
  }

  async checkChannel(channel) {
    if(!(channel instanceof VoiceChannel)) throw new Error('Channel is not voice channel!');
    for(let [, member] of channel.members) {
      const allowed = member.mute || await getProp(member, 'allowVoice', true);
      if (!allowed) return false;
    }
    return true;
  }

  async parseVoiceUpdate(member) {
    const guild = member.guild;
    if(!guild) return;
    if(!guild.voiceConnection) return;
    if(member.mute) return;
    if(member.voiceChannel !== guild.voiceConnection.channel) return;
    if(await getProp(member, 'allowVoice', true)) return;
    guild.voiceConnection.emit('privacyabort');
    guild.voiceConnection.disconnect();
  }

  async forceRecheck(client) {
    for(let voiceConnection of client.guilds.cache.map(g=>g.voiceConnection).filter(g=>g)) {
      if(!await this.checkChannel(voiceConnection.channel)) {
        voiceConnection.emit('privacyabort');
        voiceConnection.disconnect();
      }
    }
  }

  stop() {
    super.stop();
    VoiceChannel.prototype.join = this.originalJoin;
  }
}

module.exports = VoicePrivacyPlugin;