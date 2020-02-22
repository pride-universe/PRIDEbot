const RestrictedCommand = require('../../restrictedCommand');

module.exports = class changeNickCommand extends RestrictedCommand {
  constructor(client) {
    super(client, {
      name: 'changenick',
      aliases: [],
      group: 'staff',
      memberName: 'changenick',
      description: 'Change everyones nick. To revert, run this command without [new nick].',
      examples: ['changenick h', 'changenick'],
      clientPermissions: ['MANAGE_NICKNAMES'],
      userPermissions: ['MANAGE_NICKNAMES'],
      format: '[new nick]',
      permGroup: 'staff',
    });
  }
  async doChange(msg, args) {
    const nickChange = msg.guild.settings.get('nickChange') || {};
    if(nickChange.active) {
      return msg.reply('There is already a nickchange in effect.');
    }
    if(nickChange.processing) {
      return msg.reply('Currently already processing a nickchange');
    }
    if(args.length <=2 || args.length > 32 || args.includes('@') || args.includes('#') || args.includes(':') || args.includes('```') || args === 'everyone' || args === 'here' || args === 'discordtag') {
      return msg.reply('Invalid nickname');
    }
    nickChange.processing = true;
    nickChange.active = true;
    nickChange.name = args;
    nickChange.original = msg.guild.members.cache.reduce((ret,m)=>(ret[m.id]=m.nickname||'',ret),{});
    msg.guild.settings.set('nickChange', nickChange);
    for(let [,member] of msg.guild.members.cache) {
      if(member.manageable) {
        await member.setNickname(nickChange.name);
      }
    }
    nickChange.processing=false;
    msg.guild.settings.set('nickChange', nickChange);
    return msg.reply('done');
  }

  async doRevert(msg) {
    const nickChange = msg.guild.settings.get('nickChange');
    if(!nickChange || !nickChange.active) {
      return msg.reply('There are no nick-changes to revert.');
    }
    if(nickChange.processing) {
      return msg.reply('Currently already processing a nickchange');
    }
    nickChange.processing = true;
    msg.guild.settings.set('nickChange', nickChange);
    for(let [,member] of msg.guild.members.cache) {
      if(member.nickname !== nickChange.name) continue;
      if(typeof nickChange.original[member.id] !== 'string') continue;
      if(member.manageable) {
        await member.setNickname(nickChange.original[member.id]);
      }
    }
    msg.guild.settings.remove('nickChange');
    return msg.reply('done');
  }

  async run(msg, args) {
    await msg.guild.members.fetch();
    if(args) return this.doChange(msg,args);
    else return this.doRevert(msg);
  }
};
