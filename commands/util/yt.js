const commando = require('discord.js-commando');
const { stripIndents, oneLine } = require('common-tags');
const ytdl = require('ytdl-core');
const { tryJoin } = require('../../modules/voiceChannelManager');

const queues = {};

function onDisconnect() {
  delete queues[this.channel.id];
}

module.exports = class YtCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'yt',
      aliases: ['play'],
      group: 'util',
      memberName: 'yt',
      description: 'Plays audio from a youtube video in the channel you\'re connected to',
      examples: ['yt <https://www.youtube.com/watch?v=qRC4Vk6kisY>'],
      guildOnly: true,
      clientPermissions: [],
      format: '<URL>',
      argsType: 'multiple',
    });
  }

  async doQueue (connection, force) {
    console.log(connection.dispatcher && connection.dispatcher.paused && !force);
    if (connection.dispatcher && !connection.dispatcher.paused && !force) return;
    const { volume } = connection.dispatcher || { volume: 1 };
    const queue = queues[connection.channel.id] || {starting: false, list: []};
    console.log(queue);
    if(queue.starting) return;
    queue.starting = true;
    try {
      const url = queue.list.shift();
      if(!url) return connection.disconnect();

      const stream = ytdl(url, { filter: 'audioonly' });

      const response = await new Promise((resolve, reject)=>stream.on('response', response=>{
        resolve(response);
      }));
      console.log(`Status: ${response.statusCode} - ${response.statusMessage}`);
      const dispatcher = connection.play(stream, { volume });
      dispatcher.on('finish', ()=>{
        dispatcher.pause();
        this.doQueue(connection);
      }).on('start', ()=>queue.starting = false);
    } catch (err) {
      console.log(err);
      queue.starting = false;
      await this.doQueue(connection);
    }
  }

  async setVolume(msg, connection, volume) {
    if(volume && volume.match(/^\d+%?$/)) {
      volume = Number.parseInt(volume);
      if(volume < 0 || volume > 100) return msg.reply('Please enter a number between 0 and 100');
      if(!connection.dispatcher) return msg.reply('Can\'t set volume, not playing anything.');
      connection.dispatcher.setVolumeLogarithmic(volume/100);
      return msg.reply(`Set volume to ${volume}%`);
    } else if(volume) {
      return msg.reply('Please enter a number between 0 and 100');
    } else {
      if(!connection.dispatcher) return msg.reply('Can\'t read volume, not playing anything.');
      return msg.reply(`Current volume is ${Math.round(connection.dispatcher.volumeLogarithmic*100)}%`)
    }
  }

  async parseCommand(msg, connection, args) {
    if(!connection) {
      return msg.reply("I need to be playing something before commands can be executed.");
    }
    switch(args[0]) {
      case 'stop':
        connection.disconnect();
        return await msg.reply('Stopped playing');
      case 'skip':
      case 'next':
        this.doQueue(connection, true);
        return await msg.reply('Skipping to next song');
      case 'volume':
      case 'vol':
        return await this.setVolume(msg, connection, args[1]);
      default:
        return await msg.reply('Unknown command, or failed to fetch video information.');
    }
  }

  async run(msg, args) {
    if(!(msg.member && msg.member.voiceChannel)) return msg.reply("You're not in a voice channel, you need to join a channel before playing audio from youtube in it.");
    let connection;
    if(msg.guild.voiceConnection) {
      if(msg.guild.voiceConnection.channel !== msg.member.voiceChannel) {
        return msg.reply("I'm already in a voice channel. I can only be in one voice channel at once.");
      } else {
        connection = msg.guild.voiceConnection;
      }
    }

    let info;
    try {
      info = await ytdl.getInfo(args[0], { filter: 'audioonly' });
    } catch (err) {
      return this.parseCommand(msg, connection, args);
    }
    const queue = queues[msg.member.voiceChannel.id] || (queues[msg.member.voiceChannel.id] = {starting: false, list: []});
    connection = connection || await tryJoin(msg.member.voiceChannel);
    if(!connection.rawListeners('disconnect').includes(onDisconnect)) {
      connection.on('disconnect', onDisconnect);
    }

    queue.list.push(info.video_url);
    await this.doQueue(connection);
    return msg.reply(`Added \`\`${info.title}\`\` to the queue.`);
  }

};
