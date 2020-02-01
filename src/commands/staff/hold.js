const RestrictedCommand = require('../../restrictedCommand');

module.exports = class IdCommand extends RestrictedCommand {
  constructor(client) {
    super(client, {
      name: 'hold',
      aliases: [],
      group: 'staff',
      memberName: 'hold',
      description: 'Prevents automatic upgrade of a new member',
      examples: ['hold add 141977677404962816', 'hold remove 141977677404962816'],
      clientPermissions: [],
      format: '[discord id]',
      permGroup: 'staff',
    });
  }

  async addToHold(msg, memberId) {
    const guild = msg.guild;
    let member;
    try {
      member = await guild.members.fetch(memberId);
    } catch (_) { /* pass */ }
    if(!member) {
      return msg.reply('Could not find a member with that ID');
    }
    const newUserConf = guild.settings.get('newUserConfig');
    if(!newUserConf || !newUserConf.enabled) msg.reply('newUser setup not enabled on this server.');
    if(!member.roles.has(newUserConf.newRole)) return msg.reply(`Specified member \`${member.user.tag}\` is not a new member.`);

    /**
     * @type {string[]}
     */
    const newUsersHold = guild.settings.get('newUsersHold', []);
    if(newUsersHold.includes(member.id)) return msg.reply(`Specified member \`${member.user.tag}\` is already held.`);
    newUsersHold.push(member.id);
    guild.settings.set('newUsersHold', newUsersHold);
    return msg.reply(`Holding back \`${member.user.tag}\` from automember`);
  }

  async removeFromHold(msg, memberId) {
    const guild = msg.guild;
    let tag;
    try {
      tag = (await this.client.users.fetch(memberId, false)).tag || 'unknown username';
    } catch (_) {
      tag = 'unknown username';
    }
    /**
     * @type {string[]}
     */
    const newUsersHold = guild.settings.get('newUsersHold', []);
    const index = newUsersHold.findIndex(id => id === memberId);
    if(index < 0) return msg.reply(`Specified member \`${tag}\` wasn't held.`);
    newUsersHold.splice(index, 1);
    guild.settings.set('newUsersHold', newUsersHold);
    return msg.reply(`Revoking hold of \`${tag}\``);
  }

  async sendList(msg) {
    msg.reply('oops?');
  }
  
  async run(msg, args) {
    if(!msg.guild) return;
    const match = args.match(/^\s*(add|remove)\s*(?:<@!?)?(\d+)>?\s*$/i);
    if (!match) return this.sendList(msg);
    const [,action, userId] = match.map(s=>s.toLowerCase());

    switch (action) {
    case 'add':
      return this.addToHold(msg, userId);
    case 'remove':
      return this.removeFromHold(msg, userId);
    default:
      return this.sendList(msg);
    }
  }
};
