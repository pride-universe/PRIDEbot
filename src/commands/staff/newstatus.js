const RestrictedCommand = require('../../restrictedCommand');
const MessageEmbed = require('discord.js').MessageEmbed;

const MS_IN_A_MINUTE = 1000 * 60;
const MS_IN_AN_HOUR = MS_IN_A_MINUTE * 60;
const MS_IN_A_DAY = MS_IN_AN_HOUR * 24;

module.exports = class NewStatus extends RestrictedCommand {
  constructor(client) {
    super(client, {
      name: 'newstatus',
      aliases: ['ns'],
      group: 'staff',
      memberName: 'newstatus',
      description: 'Get\'s the newmember status of a user',
      examples: ['newstatus 141977677404962816', 'newstatus @Linn'],
      clientPermissions: [],
      format: '<discord id|mention>',
      permGroup: 'staff',
    });
  }

  async fetchGuilds(user) {
    const members = await Promise.all(this.client.guilds.map(g=>g.members.fetch().then(u=>[g,u])));
    return members.filter(([,m])=>m.has(user.id)).map(([g,m])=>[g,m.get(user.id)]);
  }

  async run(msg, args) {
    let member, newMemberData;
    const match = args.match(/<@!?(\d+)>/);
    if(match) {
      args=match[1];
    }
    try {
      newMemberData = msg.guild.settings.get('newUsers')[args];
      member = await msg.guild.members.fetch(args);
    } catch (_) {
      return msg.reply('That does not seem to be someone with the new member role.');
    }
    if(!member || !newMemberData) {
      return msg.reply('That does not seem to be someone with the new member role.');
    }
    const embed = new MessageEmbed();
    embed.setAuthor(member.displayName, member.user.displayAvatarURL({size: 128}));
    embed.setColor(member.displayColor);
    const { joined } = newMemberData;
    const curTime = (new Date).getTime();
    const msAgo = curTime - joined;
    const daysAgo = Math.floor(msAgo / MS_IN_A_DAY);
    const hoursAgo = Math.floor((msAgo % MS_IN_A_DAY) / MS_IN_AN_HOUR);
    const minutesAgo = Math.floor(((msAgo % MS_IN_A_DAY) % MS_IN_AN_HOUR) / MS_IN_A_MINUTE);
    embed.addField('Joined', `${daysAgo} days, ${hoursAgo} hours and ${minutesAgo} minutes ago`);
    embed.addField('Message count', String(newMemberData.messages));
    embed.setTimestamp();
    return msg.replyEmbed(embed);
  }
};
