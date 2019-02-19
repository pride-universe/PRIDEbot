const RestrictedCommand = require('../../restrictedCommand');
const MessageEmbed = require('discord.js').MessageEmbed;
const Commando = require('discord.js-commando');
const util = require('util');
const Discord = require('discord.js');
const tags = require('common-tags');

const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');

const args = [
  {
    key: 'first',
    label: 'Message ID|Message Count',
    prompt: 'Please enter a message ID or a count of messages',
    type: 'searchablemessage|plusminusint',
  },
  {
    key: 'second',
    label: 'Message ID|Message Count',
    prompt: 'Please enter a message ID or a count of messages',
    type: 'searchablemessage|plusminusint',
    default: {up: 0, down: 0}
  }
];

module.exports = class ScreenshotCommand extends RestrictedCommand {
  constructor(client) {
    super(client, {
      name: 'screenshot',
      aliases: ['ss'],
      group: 'staff',
      memberName: 'screenshot',
      description: 'Screenshots messages',
      examples: ['screenshot 547276594897485824', 'screenshot 547276594897485824 547283344627597313', , 'screenshot 547276594897485824 +-5', 'screenshot 547276594897485824 5', 'screenshot 20'],
      clientPermissions: [],
      permGroup: 'staff',
      args,
    });
  }

  makeResultMessages(result) {
		const inspected = util.inspect(result, { depth: 2 })
			.replace(nlPattern, '\n');
		const split = inspected.split('\n');
		const last = inspected.length - 1;
		const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== "'" ? split[0] : inspected[0];
		const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== "'" ?
			split[split.length - 1] :
			inspected[last];
		const prepend = `\`\`\`javascript\n${prependPart}\n`;
		const append = `\n${appendPart}\n\`\`\``;
    return Discord.splitMessage(tags.stripIndents`
      \`\`\`javascript
      ${inspected}
      \`\`\`
    `, { maxLength: 1900, prepend, append });
	}
  replyInspect(msg, obj) {
    const result = this.makeResultMessages(obj);
    if(Array.isArray(result)) {
			return result.map(item => msg.reply(item));
		} else {
			return msg.reply(result);
		}
  }

  async fetchFromUntil(from, until) {
    const collections = [];
    let curCollection;
    let fromId = from.id;
    while ((curCollection = await from.channel.messages.fetch({after: fromId}, false)).size > 0) {
      collections.unshift(curCollection);
      fromId = curCollection.first().id;
      if(fromId >= until.id) break;
    }
    return (new Discord.Collection()).concat(...collections).set(from.id, from).filter(m=>m.id <= until.id).array().reverse();
  }

  async fetchAmount(from, amount) {
    if(amount === 0) return [];
    const collections = [];
    let curCollection;
    let fromId = from.id
    if(amount > 0) {
      let acc = 0;
      while ((curCollection = await from.channel.messages.fetch({after: fromId, limit: amount}, false)).size > 0) {
        collections.unshift(curCollection);
        fromId = curCollection.first().id;
        acc += curCollection.size;
        if(acc > amount) break;
      }
      return (new Discord.Collection()).concat(...collections).array().reverse().filter((_,i)=>{console.log(i);return i<amount;});
    } else {
      amount = Math.abs(amount);
      let acc = 0;
      while ((curCollection = await from.channel.messages.fetch({before: fromId, limit: amount}, false)).size > 0) {
        collections.push(curCollection);
        fromId = curCollection.first().id;
        acc += curCollection.size;
        if(acc > amount) break;
      }
      return (new Discord.Collection()).concat(...collections).array().filter((_,i)=>{console.log(i);return i<amount;}).reverse();
    }
  }


  async fetchMessages(msg, {first, second} = args) {
    if(first instanceof Commando.CommandoMessage && second instanceof Commando.CommandoMessage) {
      if(first.channel !== second.channel) throw new Commando.FriendlyError('Both messages need to be in the same channel');
      [first, second] = [first, second].sort((a,b)=>a.id-b.id);
      console.log(first.id, second.id);
      return this.fetchFromUntil(first, second);
    }
    const pivot = first instanceof Commando.CommandoMessage ? first : second instanceof Commando.CommandoMessage ? second : msg;
    const range = {up: 0, down: 0};
    if(first.up) {
      range.up = Math.max(first.up, range.up);
    }
    if(second.up) {
      range.up = Math.max(second.up, range.up);
    }
    if(first.down) {
      range.down = Math.max(first.down, range.down);
    }
    if(second.down) {
      range.down = Math.max(second.down, range.down);
    }
    return (await this.fetchAmount(pivot, -range.up)).concat(pivot, await this.fetchAmount(pivot, range.down));

  }

  async run(msg, args) {
    return this.replyInspect(msg, (await this.fetchMessages(msg, args)).map(m=>m.content));
    //return replyInspect(msg, args);
  }
};