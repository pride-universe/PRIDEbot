const EventEmitter = require('events');
const { stripIndents, oneLine } = require('common-tags');

const UPDATE_INTERVAL = 5000;
const MAX_MESSAGES_BELOW = 10;
const PROGRESS_BAR_LEN = 13;

function formatTime(time) {
  let seconds = parseInt((time / 1000) % 60);
  let minutes = parseInt((time / (1000 * 60)) % 60);
  let hours = parseInt(time / (1000 * 60 * 60));
  seconds = (seconds < 10) ? '0' + seconds : String(seconds);
  minutes = (minutes < 10) ? '0' + minutes + ':' : minutes  + ':';
  hours = (hours !== 0) ? (hours < 10) ? '0' + hours + ':' : hours  + ':' : '';
  return hours + minutes + seconds;
}

const controlEmojis = [
  ['previous',   '⏮'],
  ['play/pause', '⏯'],
  ['stop',       '⏹'],
  ['next',       '⏭'],
  ['lower',      '🔉'],
  ['louder',     '🔊'],
  //['favorite',   '👍'],
  //['help',       '❓'],
  ['quit',       '❌'],
];

class MediaController extends EventEmitter {
  constructor(mediaPlayer) {
    super();
    this._updating = false;
    this._fixingReactions = false;
    this._timeout = null;
    this._destroyed = false;

    this.mediaPlayer = mediaPlayer;
    this.channel = mediaPlayer.commandChannel;
    this.client = mediaPlayer.client;
    this.message = null;

    this.handleReaction = this.handleReaction.bind(this);

    this.client.on('messageReactionAdd', this.handleReaction);
    this.updateMessage();
  }

  handleReaction(reaction, user) {
    if(reaction.message !== this.message) return;
    if(user.id === this.client.user.id) return;
    reaction.users.remove(user);
    
    const control = controlEmojis.find(e=>reaction.emoji.name === e[1]);
    if(!control) return;
    const member = this.channel.guild.members.get(user.id);
    this.emit(control[0], member);
  }

  async fixReactions() {
    if(this._fixingReactions || this._destroyed) return;
    this._fixingReactions = true;
    const reactions = this.message.reactions;
    let lookingForIndex = 0;
    let steps = [];
    reactions.forEach(reaction => {
      //console.log(reaction.users.size);
      //console.log(reaction.emoji.name , controlEmojis[lookingForIndex][1]);
      reaction.users.forEach((user) => {
        if(user !== this.client.user || lookingForIndex >= controlEmojis.length || reaction.emoji.name !== controlEmojis[lookingForIndex][1]) {
          steps.push(() => reaction.users.remove(user));
        }
      });
      if(lookingForIndex < controlEmojis.length && reaction.emoji.name === controlEmojis[lookingForIndex][1]) {
        lookingForIndex++;
      }
    });

    for(let i = lookingForIndex; i < controlEmojis.length; i++) {
      steps.push(() => this.message.react(controlEmojis[i][1]));
    }
    //console.log(steps.map(e=>e.toString()));
    if(steps.length > controlEmojis.length + 1) {
      steps = [
        () => reactions.removeAll(),
        ...controlEmojis.map(e => () => this.message.react(e[1]))
      ];
    }
    //console.log(steps.map(e=>e.toString()));
    for(let step of steps) {
      try {
        await step();
      } catch (e) {
        break;
      }
    }
    this._fixingReactions = false;
  }

  async updateMessage() {
    if(this._updating || this._destroyed) return;
    clearTimeout(this._timeout);
    const current = this.mediaPlayer.current;
    this._updating = true;

    if(this.message && this.message.deleted) {
      this.message = null;
    }
    if(this.message && !this.channel.messages.last(MAX_MESSAGES_BELOW).includes(this.message)) {
      await this.message.delete();
      this.message = null;
    }

    if(!this.message) {
      this.message = await this.channel.send(this.controllerContent);
      this.fixReactions();
    } else {
      await this.message.edit(this.controllerContent);
    }

    // TODO: https://github.com/discordjs/discord.js/issues/2653
    //await this.fixReactions();

    if(current && current.isPlaying) {
      this._timeout = setTimeout(Reflect.apply, UPDATE_INTERVAL, this.updateMessage, this, []);
    }
    this._updating = false;
  }

  get progressBar() {
    const current = this.mediaPlayer.current;
    const arr = new Array(PROGRESS_BAR_LEN-2).fill('─');
    if(current && current.length && current.time) {
      let curPos = current.time / current.length;
      curPos = Math.round(curPos * arr.length);
      arr[curPos] = '┼';
    }
    return ['┠'].concat(arr,'┨').join('');
  }

  get time() {
    const current = this.mediaPlayer.current;
    return oneLine`(
    ${current && current.time ? formatTime(current.time) : '--:--'}
    /
    ${current && current.length ? formatTime(current.length) : '--:--'}
    )`;
  }
  get volume() {
    return this.mediaPlayer.volume;
  }
  get volumeIcon() {
    const vol = this.volume;
    if(vol <= 0) return '🔈';
    if(vol <= .6) return '🔉';
    return '🔊';
  }

  get status() {
    const current = this.mediaPlayer.current;
    if(!current || current.isStopped) return '⏹ Stopped';
    if(current.isPaused) return '⏸ Paused';
    return '▶ Playing';
  }

  get controllerContent() {
    const current = this.mediaPlayer.current;
    return stripIndents`
    ${this.status}
    **Current track:** ${current?`${current.name} (from ${current.constructor.service()})`:'none'}
    ${this.progressBar} ${this.time}
    **Queue:** ${this.mediaPlayer.queue.length} track${this.mediaPlayer.queue.length!==1?'s':''}
    ${this.volumeIcon} ${this.volume*100}%`;
  }

  destroy(member) {
    this._destroyed = true;
    this.message.reactions.removeAll();
    this.message.edit(`Media player closed${member?` by ${member.displayName}.`:''}`);
    this.removeAllListeners();
    this.client.off('messageReactionAdd', this.handleReaction);
    this.message = null;
    this.mediaPlayer = null;
    this.channel = null;
    this.client = null;
  }
}

module.exports = MediaController;