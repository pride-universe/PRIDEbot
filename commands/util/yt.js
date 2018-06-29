const commando = require('discord.js-commando');
const { stripIndents, oneLine } = require('common-tags');
const ytdl = require('ytdl-core');
const fs = require('fs');

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
    });
  }
  async run(msg, args) {
    /*const stream = ytdl(args, { filter: 'audioonly' });
    stream.on('end', () => {
      msg.reply('Audio downloaded!');
    });
    const response = await new Promise((resolve, reject)=>stream.on('response', response=>{
      resolve(response);
    }));
    console.log(`Status: ${response.statusCode} - ${response.statusMessage}`);
    //console.log(stream);
    //stream.pipe(fs.createWriteStream('audio.webm'));*/
    const connection = await msg.channel.guild.channels.get('448171713444708366').join();
    connection.play(ytdl(args, { filter: 'audioonly' })/*, {type: 'webm/opus'}*/).on('debug', info=>console.log('DEBUG: ', info)).on('error', err=>console.log('ERROR: ',err)).on('start', ()=>console.log('START!'));
  }
};
