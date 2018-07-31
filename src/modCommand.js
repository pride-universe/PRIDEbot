const commando = require('discord.js-commando');

function isUsable(message = null) {
  if(!message) return false;
  if(!message.member) return false;
  if(message.member.permissions.has('MANAGE_CHANNELS')) return true;
  if(!message.guild) return false;
  const modRoles = message.guild.settings.get('modRoles');
  if(!modRoles) return false;
  let isMod = false;

  for(const modRole of modRoles) {
    if(message.member.roles.has(modRole)) {
      isMod = true;
      break;
    }
  }

  if(isMod) return true;
  return false;
}

module.exports = class ModCommand extends commando.Command {
  constructor(client, opts) {
    super(client, opts);
    const orgRun = this.run;
    Reflect.defineProperty(this, 'run', {
      value: function run(...args) {
        const msg = args[0];
        if(!isUsable(msg.message)) {
          this.client.emit('commandBlocked', msg, 'missingRole');
          return msg.reply(`The \`${this.name}\` command can only be used by moderators.`);
        }
        return orgRun.apply(this, args);
      }
    });
  }

  isUsable(message = null) {
    if(!super.isUsable(message)) return false;
    return isUsable(message);
  }
};
