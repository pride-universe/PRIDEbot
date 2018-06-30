const { getProp } = require('./userData');
const { VoiceChannel } = require('discord.js');
const { FriendlyError } = require('discord.js-commando');

async function parseVoiceUpdate(member) {
  const guild = member.guild;
  if(!guild) return;
  if(!guild.voiceConnection) return;
  if(member.mute) return;
  if(member.voiceChannel !== guild.voiceConnection.channel) return;
  if(await getProp(member, 'allowVoice', true)) return;

  guild.voiceConnection.channel.leave();
}

async function checkChannel(channel) {
  if(!(channel instanceof VoiceChannel)) throw new Error('Channel is not voice channel!');
  for(let [, member] of channel.members) {
    const allowed = member.mute || await getProp(member, 'allowVoice', true);
    if (!allowed) return false;
  }
  return true;
}

async function tryJoin(channel) {
  if(!await checkChannel(channel)) throw new FriendlyError(`There are unmuted users who have requested to not have me in the same voice channel as them in the channel you're trying to get me to join. I cannot join until they have muted themselves or left. Please don't try to force any user to leave or mute, their privacy, right to feel safe and right to partake in this community is more important than whatever you're trying to get me to do!`)
  return await channel.join();
}

async function forceRecheck(client) {
  for(let channel of client.guilds.filter(g=>g.voiceConnection).map(g=>g.voiceConnection.channel)) {
    if(!await checkChannel(channel)) channel.leave();
  }
}

module.exports = {
  parseVoiceUpdate,
  tryJoin,
  forceRecheck,
}
