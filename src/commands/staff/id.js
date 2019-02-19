const RestrictedCommand = require('../../restrictedCommand');
const MessageEmbed = require('discord.js').MessageEmbed;
const Commando = require('discord.js-commando');

/**
 * 
 * @param {Date} dateObj
 * @returns {string}
 */
function formatDate(dateObj) {
  const year = (dateObj.getUTCFullYear()).toString();
  const month = (dateObj.getUTCMonth()+1).toString();
  const date = (dateObj.getUTCDate()).toString();
  const hours = (dateObj.getUTCHours()).toString();
  const minutes = (dateObj.getUTCMinutes()).toString();
  return `${year.padStart(4,'0')}-${month.padStart(2,'0')}-${date.padStart(2,'0')} ${hours.padStart(2,'0')}:${minutes.padStart(2,'0')} UTC`;
}

module.exports = class StatsCommand extends RestrictedCommand {
  constructor(client) {
    super(client, {
      name: 'id',
      aliases: [],
      group: 'staff',
      memberName: 'id',
      description: 'Gets the user info from a discord id/snowflake',
      examples: ['id 141977677404962816'],
      clientPermissions: [],
      format: '<discord id>',
      permGroup: 'staff',
    });
  }

  async fetchGuilds(user) {
    const members = await Promise.all(this.client.guilds.map(g=>g.members.fetch().then(u=>[g,u])));
    return members.filter(([,m])=>m.has(user.id)).map(([g,m])=>[g,m.get(user.id)]);
  }

  async run(msg, args) {
    let user;
    try {
      user = await this.client.users.fetch(args);
    } catch {}
    if(!user) {
      msg.reply('Could not find a user with that ID');
      return;
    }
    const guilds = await this.fetchGuilds(user);
    const embed = new MessageEmbed();
    embed.setAuthor(user.tag, user.displayAvatarURL({size: 128}));
    embed.setDescription(`This account was created ${formatDate(user.createdAt)}

${guilds.length ? '**I can see this user on these servers:**' : '**I do not share a server with this user**'}
${guilds.map(([g,m])=>`\`${g.name}\` as \`${m.displayName}\``).join('\n')}`);
    embed.setTimestamp();
    msg.replyEmbed(embed);
  }
};
