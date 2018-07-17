const { Plugin } = require('discord.js-plugins');
const { Collection } = require('discord.js');
const { FriendlyError } = require('discord.js-commando');
const MediaController = require('../../media/controller');

class MediaPlayer {
  constructor(client, guild) {
    const settings =  guild.settings.get('music');
    if(!settings || !settings.voiceChannel || !settings.commandChannel) throw new FriendlyError('Music is not configured on this server');
    this.client = client;
    this.guild = guild;
    this.commandChannel = client.channels.get(settings.commandChannel);
    this.voiceChannel = client.channels.get(settings.voiceChannel);
    this._volume = 1;
    this.queue = [];
    this.backlog = [];
    this.current = null;
    this.playing = false;
    this.controller = new MediaController(this);
    this.controller.on('next', ()=>this.next());
    this.controller.on('play/pause', ()=>this.playPause());
    this.controller.on('stop', ()=>this.stop());
    this.controller.on('previous', ()=>this.previous());
    this.controller.on('lower', ()=>this.lower());
    this.controller.on('louder', ()=>this.louder());
    this.controller.on('help', ()=>this.louder());
    this.controller.on('quit', (member)=>this.destroy(member));

    this.onChange = this.onChange.bind(this);

    this._destroyed = false;
  }

  get volume() {
    return this._volume;
  }

  set volume(val) {
    this._volume = Math.clamp(Math.round(val * 100) / 100, 0, 1);
    this.onChange();
    if(this.current && this.current.dispatcher) {
      this.current.dispatcher.setVolumeLogarithmic(this._volume);
    }
  }

  get isPlaying() {
    return Boolean(this.current && this.current.isPlaying);
  }

  enqueue(streamable, prepend=false) {
    if(prepend) {
      this.queue.push(streamable);
    } else {
      this.queue.unshift(streamable);
    }
    this.onChange();
    if(!this.current) this.next();
  }

  next() {
    if(this.current) this.backlog.push(this.current);
    this.stop();
    this.current = this.queue.pop() || null;
    this.play();
  }

  previous() {
    if(!this.backlog.length) return;
    if(this.current) this.enqueue(this.current, true);
    this.stop();
    this.current = this.backlog.pop();
    this.play();
  }

  lower() {
    this.volume -= .1;
  }

  louder() {
    this.volume += .1;
  }

  onChange() {
    setImmediate(()=>this.controller.updateMessage());
  }

  async play() {
    if(!this.current || this.current.isPlaying) {
      this.onChange();
      return;
    }
    if(this.current.isPaused) {
      this.current.resume();
      this.onChange();
      return;
    }

    let voiceConnection = this.voiceChannel.guild.voiceConnection;
    if(voiceConnection) {
      if(voiceConnection.channel !== this.voiceChannel) {
        throw new FriendlyError('I\'m connected to another voice channel, I cannot join the music channel to play music at this moment.');
      }
    } else {
      voiceConnection = await this.voiceChannel.join();
    }
    try {
      this.current.play(voiceConnection).setVolumeLogarithmic(this.volume);
      this.onChange();
      this.current.on('change', this.onChange);
      this.current.on('error', ()=>{this.current=null; this.next();});
      this.current.on('end', ()=>this.next());
    } catch (e) {
      this.current.stop();
      this.current = null;
      this.next();
    }
  }

  async pause() {
    if(this.current) {
      this.current.pause();
      this.onChange();
    }
  }

  playPause() {
    if(!this.isPlaying) return this.play();
    else return this.pause();
  }

  stop() {
    if(this.current && !this.current.isStopped) {
      this.current.stop();
      this.onChange();
    }
  }

  destroy(member) {
    if(this._destroyed) return;
    this._destroyed = true;
    this.controller.destroy(member);
    if(this.current) this.current.stop();
    if(this.voiceChannel.guild.voiceConnection) {
      this.voiceChannel.guild.voiceConnection.disconnect();
    }
    this.client.plugins.get('media:player').remove(this.guild, member);
    this.current = null;
  }
}

class MediaPlayerPlugin extends Plugin {
  constructor(client) {
    const info = {
      name: 'player',
      group: 'media',
      description: 'Plays media streams',
      details: 'Plays media streams and manages playlists and queues'
    };
    super(client, info);
    this.instances = new Collection();
  }

  get(guild) {
    guild = this.client.guilds.resolve(guild);
    if(!this.instances.has(guild)) this.instances.set(guild, new MediaPlayer(this.client, guild));
    return this.instances.get(guild);
  }

  remove(guild, member) {
    guild = this.client.guilds.resolve(guild);
    const mediaPlayer = this.instances.get(guild);
    if(mediaPlayer) {
      this.instances.delete(guild);
      mediaPlayer.destroy(member);
      return true;
    }
    return false;
  }

  stop() {
    super.stop();
    this.instances.forEach(e=>e.destroy());
    this.instances.clear();
  }
}

module.exports = MediaPlayerPlugin;