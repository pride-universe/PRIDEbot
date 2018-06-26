const commando = require('discord.js-commando');
const { waSecret } = require('../../secrets');
const { stripIndents, oneLine } = require('common-tags');
const db = require('../../db');

const trackUsers = {
  'jo': '284521436389965824',
};

module.exports = class CultCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'cult',
      aliases: [],
      group: 'jokes',
      memberName: 'cult',
      description: 'Counts how many times Jo has said the word "Cult"',
      examples: ['cult'],
      guildOnly: false,
      clientPermissions: [],
      format: '',
    });
  }
  async run(msg, args) {
    const counts = JSON.parse((await db().get('SELECT value FROM jokes WHERE identifier = ?', 'cult') || {value: "{}"}).value);
    const user = trackUsers[args.toLowerCase()] ? {name: args.toLowerCase(), id: trackUsers[args.toLowerCase()]} : {name: 'jo', id: trackUsers['jo']};
    const count = counts[user.id] || 0;
    msg.reply(oneLine`${msg.guild && msg.guild.members.get(user.id) ? msg.guild.members.get(user.id).displayName : user.name.replace(/^\w/,l=>l.toUpperCase())}
    has said the word "cult" ${count} ${count!==1 ? 'times' : 'time'}.`);
  }
  static trackUsers () {
    return trackUsers;
  }
};
