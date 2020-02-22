const commando = require('discord.js-commando');

module.exports = class RestrictedCommand extends commando.Command {
  constructor(client, opts) {
    const permGroup = opts.permGroup;
    opts.guildOnly = true;
    delete opts.permGroup;
    super(client, opts);

    this.permGroup = permGroup;
  }

  checkPermgroup(message, ownerOverride = true, permGroup) {
    permGroup = permGroup || this.permGroup;
    if(ownerOverride && this.client.isOwner(message.author)) return true;

    const perms = message.guild.settings.get('permissionRoles');
    if(!perms) return false;
    if(!perms[permGroup]) return false;
    const roles = Array.isArray(perms[permGroup])
      ? perms[permGroup]
      : [perms[permGroup]];

    for(const role of roles) {
      if(message.member.roles.cache.has(role)) {
        return true;
      }
    }
    return false;
  }
  
  hasPermission(message, ownerOverride = true) {
    const superRes = super.hasPermission(message, ownerOverride);
    if(superRes !== true) return superRes;
    if(this.checkPermgroup(message, ownerOverride)) return true;
    return `The \`${this.name}\` command can only be used by ${this.permGroup}.`;
  }
};
