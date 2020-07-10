/**
 * @typedef {import('discord.js').Message Message
 */
const RestrictedCommand = require('../../restrictedCommand');
const { encodeSnowflake } = require('../../modules/snowflakeString');
const { getPermGroups, getSelfRoleGroups, invalidateCache } = require('../../modules/roles');

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
    this.invalidateCache = (role) => invalidateCache(role.guild);
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
      str += `\n**${group.name}:\n**`;
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
        str += `\`\`${role.name.padEnd(maxLen)}\u200b\`\`${msg.member.roles.cache.has(role.id)?' `✅`':''}${dupeString}\n`;
      }
    }
    str += '\nRoles marked with `✅` are roles you already have\n';
    if(hasDupe) {
      str += '\nDuplicate name exist in case you have a preference over which role color you want. You will get the color of the role with the highest position in the list.\n';
    }
    str += '\nAre we missing a role? Just ask a moderator to add it!\n';
    str += `\nTired of typing commands? Try ${process.env.VUE_APP_BASE_URL}/r/${encodeSnowflake(msg.guild.id)}\n`;
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
    if(roleEntry.permGroup && !permGroups.has(roleEntry.permGroup)) return msg.reply(`You are not allowed to self-assign \`\`${roleEntry.role.name}${index?'~'+(index+1):''}\`\``);
    const role = roleEntry.role;
    if(!msg.member.roles.cache.has(role.id)) {
      msg.member.roles.add(role);
      return msg.reply(`Added role \`\`${role.name}\`\` to you`);
    } else {
      msg.member.roles.remove(role);
      return msg.reply(`Removed role \`\`${role.name}\`\` from you`);
    }
  }
  /**
   * 
   * @param {Message} msg 
   * @param {string} args 
   */
  async run(msg, args) {
    if(!msg.guild) return;

    const permGroups = await getPermGroups(msg.guild, msg.member);

    const groups = await getSelfRoleGroups(msg.guild);

    if(!args) {
      const listGroups = groups.filter(group => {
        return !group.permGroup || permGroups.has(group.permGroup);
      });
      if(!listGroups.length) {
        return msg.reply('There are no self roles you can assign on this server');
      }
      return this.listRoles(listGroups, msg);
    } else {
      if(!groups.length) {
        return msg.reply('There are no self roles defined on this server');
      }
      const upper = [...groups.values()].reduce((acc, {start}) => acc ? acc.position < start.position ? start : acc : start, null);
      if(msg.guild.me.roles.highest.position < upper.position) return msg.reply(`Missing role high enough to give out roles. I require role \`\`${upper.name}\`\` or higher to be able to hand out roles.`);
      return this.assignRole(groups, permGroups, msg, args);
    }
  }
};
