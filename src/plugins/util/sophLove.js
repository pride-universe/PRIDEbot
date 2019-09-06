/* eslint-disable no-constant-condition */
const { Plugin } = require('discord.js-plugins');
const { ifttKey } = require('../../../secrets');
const https = require('https');

const RAY_ID = '510875897801474059';
const SOPH_ID = '72368524286238720';
const LEWD_PATH = '573294176498614332/573294304894648323';
const GENERAL_PATH = '573294176498614332/573294176498614334';

const START_DATE = 1559782800000;

function blockRayDMCommands(msg) {
  if(msg.author.id !== RAY_ID) return false;
  if(msg.channel.type !== 'dm') return false;
  return 'Asking a question, no commands should be executed';
}

function blockSophGenCommands(msg) {
  if(msg.author.id !== SOPH_ID) return false;
  if(msg.channel.id !== GENERAL_PATH.split('/')[1]) return false;
  return 'Asking a question, no commands should be executed';
}

class SophieLove extends Plugin {
  constructor(client) {
    const info = {
      name: 'sophLove',
      group: 'util',
      description: 'Sends love and kisses to Sophie',
      guarded: false,
      autostart: true,
      startOn: ['ready', 'providerReady']
    };
    super(client, info);
  }

  async start() {
    const time = START_DATE-new Date().getTime();
    if(time<=0) return this.client.setTimeout(()=>this.stop(), 1);
    this.rayDM = await this.client.users.get(RAY_ID).createDM();
    this.soph = this.client.users.get(SOPH_ID);
    const [genServID, genChanID] = GENERAL_PATH.split('/');
    this.generalChannel = this.client.guilds.get(genServID).channels.get(genChanID);
    const [lewdServID, lewdChanID] = LEWD_PATH.split('/');
    this.lewdChannel = this.client.guilds.get(lewdServID).channels.get(lewdChanID);
    this.timeout = this.client.setTimeout(()=>this.activate(), time);
  }

  async stop() {
    this.client.clearTimeout(this.timeout);
    this.client.dispatcher.removeInhibitor(blockRayDMCommands);
    this.client.dispatcher.removeInhibitor(blockSophGenCommands);
  }

  async activate() {
    this.client.dispatcher.addInhibitor(blockRayDMCommands);
    this.rayDM.send(`Hi Ray! It's me, Linn! ... Well, I'm sleeping technically, this is PAST Linn! OoooOOo TIME TRAVEL! At any rate, I have a thing planned for Sophie, since she's always asleep nowadays when I go to bed. Buuut, since I don't want to leave a script to just blindly send a message when I have no idea what the current circumstances are... We're gonna play 20 questions about the current situation! You'll be able to abort this silliness at any time by typing \`abort\`? Ready?

No that was a rethorical question

Here's the real question. **Did Sophie get trough the entire workday?**

(Speed programming here, I can only understand Yes/No at the moment, sentient AI version of Linn will come with a future update)`);
    loop: while(true) {
      const messages = await this.rayDM.awaitMessages(m=>m.author.id===RAY_ID, {max: 1});
      const content = messages.first().content;
      switch(content.toLowerCase()) {
      case 'yes':
        this.stateWorkDone();
        break loop;
      case 'no':
        this.stateWorkUnwell();
        break loop;
      case 'abort':
        this.stateEnd();
        break loop;
      default:
        this.rayDM.send('Please specify one of `yes`, `no` or `abort`');
      }
    }
  }

  async stateSendLewd() {
    this.rayDM.send('Thanks Ray! Love you lots! And thanks for dealing with this silly bot thing I made :3');
    this.lewdChannel.send(`Hi ${this.soph}! I love you and great job on making it through (I REMEMBERED THE H!) the workday today! Here's a complementary lewd :3`, {files: ['lewd.mp4']});
    this.stateEnd();
  }

  async stateWorkDone() {
    this.rayDM.send('Okay, that\'s good! Did something at work go wrong where praise for making it trough the workday would not be taken in a good way?');
    loop: while(true) {
      const messages = await this.rayDM.awaitMessages(m=>m.author.id===RAY_ID, {max: 1});
      const content = messages.first().content;
      switch(content.toLowerCase()) {
      case 'yes':
        this.stateWorkUnwell();
        break loop;
      case 'no':
        this.stateWorkWell();
        break loop;
      case 'abort':
        this.stateEnd();
        break loop;
      default:
        this.rayDM.send('Please specify one of `yes`, `no` or `abort`');
      }
    }
  }

  async stateWorkWell() {
    this.rayDM.send('Okay, that\'s awesome! Is there any reason I should not send a congratulatory lewd to #lewds in our server?');
    loop: while(true) {
      const messages = await this.rayDM.awaitMessages(m=>m.author.id===RAY_ID, {max: 1});
      const content = messages.first().content;
      switch(content.toLowerCase()) {
      case 'yes':
        this.stateOtherUnwell();
        break loop;
      case 'no':
        this.stateSendLewd();
        break loop;
      case 'abort':
        this.stateEnd();
        break loop;
      default:
        this.rayDM.send('Please specify one of `yes`, `no` or `abort`');
      }
    }
  }

  async stateOtherUnwell() {
    this.rayDM.send('Hmm, I assume something else is up then. Do you think Soph would benefit from having a silly bot-Linn coming in and saying I love you?');
    loop: while(true) {
      const messages = await this.rayDM.awaitMessages(m=>m.author.id===RAY_ID, {max: 1});
      const content = messages.first().content;
      switch(content.toLowerCase()) {
      case 'yes':
        this.stateEngageSophOther();
        break loop;
      case 'no':
        this.stateAbortSoph();
        break loop;
      case 'abort':
        this.stateEnd();
        break loop;
      default:
        this.rayDM.send('Please specify one of `yes`, `no` or `abort`');
      }
    }
  }

  async stateAbortSoph() {
    this.rayDM.send('Yeah, a bot isn\'t always the solution. Be there for her okay? Love you both!');
    this.stateEnd();
  }

  async stateWorkUnwell() {
    this.rayDM.send('Okay, that\'s not good. Would Sophie appreciate getting a prerecorded loving message from me? If you answer `no ` I\'m just gonna stay out of it.');
    loop: while(true) {
      const messages = await this.rayDM.awaitMessages(m=>m.author.id===RAY_ID, {max: 1});
      const content = messages.first().content;
      switch(content.toLowerCase()) {
      case 'yes':
        this.stateEngageSophWork();
        break loop;
      case 'no':
        this.stateAbortSoph();
        break loop;
      case 'abort':
        this.stateEnd();
        break loop;
      default:
        this.rayDM.send('Please specify one of `yes`, `no` or `abort`');
      }
    }
  }

  async stateEngageSophWork() {
    this.rayDM.send('Okay, thanks for the help! I\'ll stop bothering you now and send Soph a message. Love you to bits!!!');
    this.client.dispatcher.removeInhibitor(blockRayDMCommands);
    this.client.dispatcher.addInhibitor(blockSophGenCommands);
    this.generalChannel.send(`Hi ${this.soph}! I love you to bits. I heard something went less than amazing at work. Do you wanna talk about it?

(I'm just a rudamentary if/else machine, I won't take offense if you say no. Actually \`yes\` \`no\` are the only anwers I understand)`);
    loop: while(true) {
      const messages = await this.generalChannel.awaitMessages(m=>m.author.id===SOPH_ID, {max: 1});
      const content = messages.first().content;
      switch(content.toLowerCase()) {
      case 'yes':
        this.stateWakeLinn();
        break loop;
      case 'no':
        this.stateByeSoph();
        break loop;
      default:
        this.rayDM.send('So sorry, I can only understand `yes` and `no`.');
      }
    }
  }

  async stateEngageSophOther() {
    this.rayDM.send('Okay, thanks for the help! I\'ll stop bothering you now and send Soph a message. Love you to bits!!!');
    this.client.dispatcher.removeInhibitor(blockRayDMCommands);
    this.client.dispatcher.addInhibitor(blockSophGenCommands);
    this.generalChannel.send(`Hi ${this.soph}! I love you to bits. I heard something is up, do you want to talk about it?

(I'm just a rudamentary finite state machine, I won't take offense if you say no. Actually \`yes\` \`no\` are the only anwers I understand)`);
    loop: while(true) {
      const messages = await this.generalChannel.awaitMessages(m=>m.author.id===SOPH_ID, {max: 1});
      const content = messages.first().content;
      switch(content.toLowerCase()) {
      case 'yes':
        this.stateWakeLinn();
        break loop;
      case 'no':
        this.stateByeSoph();
        break loop;
      default:
        this.rayDM.send('So sorry, I can only understand `yes` and `no`.');
      }
    }
  }

  async stateByeSoph() {
    this.generalChannel.send('Okay, I understand. We\'ll talk about it tomorrow okay? Love you to bits! _hugs_');
    this.stateEnd();
  }

  async stateWakeLinn() {
    this.generalChannel.send('Okay, since I have like... less than an hour now to finish this bot thing. Which is most definitely not enough time to write a sentient AI capable of comforting you. Me, past Linn will simply wake current, sleeping Linn up for a chat. You\'ll probably be mad. I don\'t care. I\'ve been unable to be there for you so many nights now I\'m making this decision now.');
    https.get(`https://maker.ifttt.com/trigger/wake_me/with/key/${ifttKey}`, resp => {
      let data = '';
    
      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });
    
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        console.log(`DATA RECEIVED FROM IFTTT: ${data}`);
      });
    
    }).on('error', (err) => {
      console.log('Error: ' + err.message);
    });
    this.stateEnd();
  }

  async stateEnd() {
    this.stop();
  }
}

module.exports = SophieLove;