const { Plugin } = require('discord.js-plugins');

class AutoRole extends Plugin {
  constructor(client) {
    const info = {
      name: 'autoRole',
      group: 'util',
      description: 'Gives a member a role upon join',
      guarded: true
    };
    super(client, info);
  }

  async start() {
    this.client.on('guildMemberAdd', (...args) => this.onGuildMemberAdd(...args));
  }

  onGuildMemberAdd(newMember) {
    const guild = newMember.guild;
    const autoRole = guild.settings.get('autoRole');
    if(!autoRole) return;
    newMember.roles.add(autoRole);
  }
}

module.exports = AutoRole;