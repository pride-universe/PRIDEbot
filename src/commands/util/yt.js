const commando = require('discord.js-commando');
const { stripIndents } = require('common-tags');
const YoutubeStream = require('../../media/streamers/youtube.js');

module.exports = class YtCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'yt',
      aliases: ['play'],
      group: 'util',
      memberName: 'yt',
      description: stripIndents`Plays audio from a youtube video in the channel you're connected to.
      Anyone who's connected to the same channel as PRIDEbot can control the queue and volume.`,
      examples: ['yt <https://www.youtube.com/watch?v=qRC4Vk6kisY>'],
      guildOnly: true,
      clientPermissions: ['CONNECT', 'SPEAK'],
      format: '<URL|COMMAND> [ARGS...]',
    });
  }

  async run(msg, args) {
    const mediaPlayer = this.client.plugins.get('media:player').get(msg.guild);
    mediaPlayer.enqueue(new YoutubeStream(args));
  }

};
