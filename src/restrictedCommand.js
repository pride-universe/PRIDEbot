const commando = require('discord.js-commando');

function isUsable(message, command) {
  if(!message) return false;
  if(message instanceof commando.CommandMessage) {
    command = command || message.command;
    message = message.message;
  }
  if(!command) return false;
  if(!message.member) return false;
  if(!message.guild) return false;
  const perms = message.guild.settings.get('permissionRoles');
  if(!perms) return false;
  if(!perms[command.permGroup]) return false;
  const roles = Array.isArray(perms[command.permGroup])
    ? perms[command.permGroup]
    : [perms[command.permGroup]];
  
  let canUse = false;
  for(const role of roles) {
    if(message.member.roles.has(role)) {
      canUse = true;
      break;
    }
  }

  if(canUse) return true;
  return false;
}

module.exports = class RestrictedCommand extends commando.Command {
  constructor(client, opts) {
    super(client, opts);

    this.permGroup = opts.permGroup;

    const orgRun = this.run;
    Reflect.defineProperty(this, 'run', {
      value: function run(...args) {
        const msg = args[0];
        if(!isUsable(msg)) {
          this.client.emit('commandBlocked', msg, 'missingRole');
          return msg.reply(`The \`${this.name}\` command can only be used by ${this.permGroup}.`);
        }
        return orgRun.apply(this, args);
      }
    });
  }
  
  isUsable(message = null) {
    if(!super.isUsable(message)) return false;
    return isUsable(message, this);
  }
};
