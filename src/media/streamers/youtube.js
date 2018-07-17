const Streamable = require('./streamable');
const ytdl = require('ytdl-core');

class YoutubeStream extends Streamable {
  constructor(url) {
    super();
    this.url = url;
  }

  play(voiceConnection) {
    const stream = ytdl(this.url, { quality: 'highestaudio' });
    stream.once('info', info => {
      this.length = info.length_seconds * 1000;
      this.name = info.title;
      this.emit('change', this);
    });
    return super.play(voiceConnection, stream);
  }

  static service() {
    return 'YouTube';
  }
}

module.exports = YoutubeStream;
