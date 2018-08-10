const Streamable = require('./streamable');
const ytdl = require('ytdl-core');

class YoutubeStream extends Streamable {
  constructor(url) {
    super();
    this.url = url;
    this.options = new Promise(async resolve => {
      try {
        const info = await ytdl.getInfo(url);
        this.length = info.length_seconds * 1000;
        this.name = info.title;
        this.emit('change', this);
        const opusFormat = info.formats.reduce((acc, format) => {
          if(!['ogg', 'webm'].includes(format.container)) return acc;
          if(format.audioEncoding !== 'opus') return acc;
          if(!acc) return format;
          if(acc.audioBitrate < format.bitrate) return format;
          return acc;
        }, null);
        if(opusFormat) return resolve({ format: opusFormat });
        return resolve({ quality: 'highestaudio' });
      } catch (err) {
        this.emit('invalid', err);
        return resolve(null);
      }
    });
  }

  async getStream() {
    const options = await this.options;
    if(!options) return null;
    const type = options.format ? `${options.format.container}/${options.format.audioEncoding}` : 'unknown';
    const stream = ytdl(this.url, options);
    stream.streamType = type;
    return stream;
  }

  async play(voiceConnection) {
    const stream = await this.getStream();
    return super.play(voiceConnection, stream);
  }

  static service() {
    return 'YouTube';
  }
}

module.exports = YoutubeStream;
