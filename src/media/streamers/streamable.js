const EventEmitter = require('events');
class Streamable extends EventEmitter {
  constructor() {
    super();
    this.dispatcher = null;
    this.stream = null;

    this.onEnd = this.onEnd.bind(this);
    this.onError = this.onError.bind(this);
  }

  get isPlaying() {
    return !this.isStopped && !this.isPaused;
  }

  get isPaused() {
    return !!this.stream && this.dispatcher.paused;
  }

  get isStopped() {
    return !this.stream;
  }

  get time() {
    return this.dispatcher && this.dispatcher.streamTime;
  }
  
  async play(voiceConnection, stream) {
    if(this.isPaused) {
      this.stream.resume();
      return this.dispatcher;
    }
    const options = { type: stream.streamType };
    this.stream = stream;
    this.dispatcher = voiceConnection.play(this.stream, options);

    this.dispatcher.on('finish', this.onEnd);
    this.dispatcher.on('error', this.onError);
    return this.dispatcher;
  }

  pause() {
    if(!this.stream) throw new Error('Stream is not playing');
    this.dispatcher.pause();
  }

  resume() {
    if(!this.stream) throw new Error('Stream is not playing');
    this.dispatcher.resume();
  }

  stopListening() {
    if(this.dispatcher) {
      this.dispatcher.off('finish', this.onEnd);
      this.dispatcher.off('error', this.onError);
    }
    this.removeAllListeners();
  }

  stop() {
    this.emit('stop');
    this.stopListening();
    if(this.stream) this.stream.destroy();
    if(this.dispatcher) this.dispatcher.destroy();
    this.stream = null;
    this.dispatcher = null;
  }

  onEnd() {
    this.emit('end');
    this.stopListening();
    if(this.stream) this.stream.destroy();
    if(this.dispatcher) this.dispatcher.destroy();
    this.stream = null;
    this.dispatcher = null;
  }

  onError(err) {
    this.emit('error', err);
    this.stopListening();
    if(this.stream) this.stream.destroy();
    if(this.dispatcher) this.dispatcher.destroy();
    this.stream = null;
    this.dispatcher = null;
  }
}

module.exports = Streamable;
