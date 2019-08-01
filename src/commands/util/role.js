const RestrictedCommand = require('../../restrictedCommand');

const startRegex = /^SELF-START\((\d+)\)\|([^|\n]+)(?:\|([^|\n]*))?$/;
const endRegex = /^SELF-END\((\d+)\)$/;
const invalidGroup = Symbol('invalidGroup');
const { FriendlyError } = require('discord.js-commando');
module.exports = class RoleCommand extends RestrictedCommand {
  constructor(client) {
    super(client, {
      name: 'role',
      aliases: ['roles'],
      group: 'util',
      memberName: 'role',
      description: 'Gives you the specified role. To get a list of all available roles, run this command with no arguments. If there are multiple roles with the same name, use `~<number>` to select which role you want',
      examples: ['role', 'role They/Them', 'role He/Him~2'],
      clientPermissions: ['MANAGE_ROLES'],
      format: '[role[~<number>]]',
      permGroup: 'members',
    });

    this.cache = new Map();
    this.invalidateCache = (role) => this.cache.delete(role.guild.id);
    this.startListeners();
  }

  startListeners()  {
    this.client.on('roleCreate', this.invalidateCache);
    this.client.on('roleDelete', this.invalidateCache);
    this.client.on('roleUpdate', this.invalidateCache);
  }

  stopListeners() {
    this.client.off('roleCreate', this.invalidateCache);
    this.client.off('roleDelete', this.invalidateCache);
    this.client.off('roleUpdate', this.invalidateCache);
  }

  unload() {
    this.stopListeners();
    super.unload();
  }
  
  reload() {
    this.stopListeners();
    super.reload();
  }
  
  async listRoles(groups, msg) {

    const dupes = new Map();
    let str = 'List of available roles:\n';
    let hasDupe = false;
    for(const group of groups) {
      const maxLen = group.roleEntries.reduce((acc, {role}) => Math.max(acc, role.name.length), 0);
      str += `\n**${group.name}:\n**`
      for(const {role} of group.roleEntries) {
        const dupeString = (()=>{
          const dupe = dupes.get(role.name.toLowerCase());
          if(!dupe) {
            dupes.set(role.name.toLowerCase(), 2);
            return '';
          } else {
            hasDupe = true;
            dupes.set(role.name.toLowerCase(), dupe+1);
            return ` [duplicate name, to select this role use \`\`${role.name}~${dupe}\`\`]`;
          }
        })();
        str += `\`\`${role.name.padEnd(maxLen)}\u200b\`\`${msg.member.roles.has(role.id)?' `✅`':''}${dupeString}\n`;
      }
    }
    str += '\nRoles marked with `✅` are roles you already have\n';
    if(hasDupe) {
      str += '\nDuplicate name exist in case you have a preference over which role color you want. You will get the color of the role with the highest position in the list.\n';
    }
    str += '\nAre we missing a role? Just ask a moderator to add it!\n';
    msg.reply(str, {split: {prepend: '\n'}});
  }

  async assignRole(groups, permGroups, msg, args) {
    const dupes = new Map();
    for(const group of groups) {
      for(const roleEntry of group.roleEntries) {
        let roleArr = dupes.get(roleEntry.role.name.toLowerCase());
        if(!roleArr) dupes.set(roleEntry.role.name.toLowerCase(), roleArr = []);
        roleArr.push(roleEntry);
      }
    }
    let [roleName, index] = args.split('~');
    roleName = roleName.trim();
    if(typeof index === 'string') index = index.trim();
    if(!dupes.has(roleName.toLowerCase())) return msg.reply(`Can't find role \`\`${roleName}\`\``);
    if(index === undefined || index === '') index = 1;
    if(!isFinite(index)) return msg.reply(`\`\`${index}\`\` is an invalid number`);
    index = Number(index);
    if(index < 1 || Math.round(index) !== index) return msg.reply('The role index must be a non-zero positive integer');
    index--;
    const roleArr = dupes.get(roleName.toLowerCase());
    if(index >= roleArr.length) return msg.reply(`Can't find role \`\`${roleName}~${index+1}\`\``);
    const roleEntry = roleArr[index];
    if(roleEntry.permGroup && !permGroups.has(roleEntry.permGroup)) return msg.reply(`You are not allowed to self-assign \`\`${roleName}${index?'~'+(index+1):''}\`\``);
    const role = roleEntry.role;
    if(!msg.member.roles.has(role.id)) {
      msg.member.roles.add(role);
      return msg.reply(`Added role \`\`${role.name}\`\` to you`);
    } else {
      msg.member.roles.remove(role);
      return msg.reply(`Removed role \`\`${role.name}\`\` from you`);
    }
    
  }

  getSelfRoleGroups(guild) {
    if(this.cache.has(guild.id)) return this.cache.get(guild.id);
    const groups = new Map();
    guild.roles.forEach(r => {
      let match;
      if(match = r.name.match(startRegex)) {
        const id = match[1];
        const name = match[2];
        const permGroup = match[3];
        
        if(!groups.has(id)) groups.set(id, {});
        const group = groups.get(id);
        if(group === invalidGroup) return;

        if(group.start) {
          groups.set(id, invalidGroup);
          return;
        }
        group.name = name;
        group.permGroup = permGroup;
        group.start = r;
        group.roleEntries = [];
      } else if(match = r.name.match(endRegex)) {
        const id = match[1];
        
        if(!groups.has(id)) groups.set(id, {});
        const group = groups.get(id);
        if(group === invalidGroup) return;

        if(group.end) {
          groups.set(id, invalidGroup);
          return;
        }

        group.end = r;
      }
    });
    for(let [key, group] of [...groups]) {
      if(group !== invalidGroup &&
        group.start &&
        group.end &&
        group.start.position > group.end.position)
        continue;
      
      groups.delete(key);
      this.client.emit('warn', `Self role group with id "${key}" is invalid.`)
    }
    const groupMarkers = new Set();
    groups.forEach(({start, end}) => groupMarkers.add(start).add(end));
    guild.roles.sort((r1,r2) => r2.position - r1.position).forEach(r => {
      for(let [,group] of groups) {
        if(r.position < group.start.position && r.position > group.end.position) {
          if(groupMarkers.has(r)) throw new FriendlyError("Overlapping self-role groups. This is not good.");
          if(r.managed) {
            this.client.emit('warn', `Role '${r.name}' in '${guild.name}' is managed by external service and not assignable, omitting from self-role.`);
            return;
          }
          if(r.permissions.bitfield & 0x79C0203E) {
            this.client.emit('warn', `Role '${r.name}' in '${guild.name}' has dangerous permissions, omitting from self-role.`);
            return;
          }
          const roleEntry = {
            permGroup: group.permGroup,
            role: r
          };
          group.roleEntries.push(roleEntry);
        }
      }
    });

    const groupsArr = [...groups].sort(([key1], [key2])=>key1-key2).map(([,group]) => group);
    this.cache.set(guild.id, groupsArr);
    return groupsArr;
  }

  getPermGroups(msg) {
    const permGroups = new Set();
    const guildPerms = msg.guild.settings.get('permissionRoles') || {};
    permLoop: for(const permGroupName of Object.keys(guildPerms)) {
      const permGroup = guildPerms[permGroupName];
      const roles = Array.isArray(permGroup)
      ? permGroup
      : [permGroup];
      for(const role of roles) {
        if(msg.member.roles.has(role)) {
          permGroups.add(permGroupName);
          continue permLoop;
        }
      }
    }
    return permGroups;
  }

  async run(msg, args) {
    if(!msg.guild) return;
    if(msg.guild.settings.get('selfRoleLimits')) {
      return this.client.registry.commands.get('legacyrole').run(msg, args);
    }

    const permGroups = this.getPermGroups(msg);

    const groups = this.getSelfRoleGroups(msg.guild);

    if(!args) {
      const listGroups = groups.filter(group => {
        return !group.permGroup || permGroups.has(group.permGroup);
      });
      if(!listGroups.length) {
        return msg.reply(`There are no self roles you can assign on this server`)
      }
      return this.listRoles(listGroups, msg);
    } else {
      if(!groups.length) {
        return msg.reply(`There are no self roles defined on this server`)
      }
      const upper = [...groups.values()].reduce((acc, {start}) => acc ? acc.position < start.position ? start : acc : start, null);
      console.log(upper.name, upper.position);
      if(msg.guild.me.roles.highest.position < upper.position) return msg.reply(`Missing role high enough to give out roles. I require role \`\`${upper.name}\`\` or higher to be able to hand out roles.`);
      return this.assignRole(groups, permGroups, msg, args);
    }
  }
};