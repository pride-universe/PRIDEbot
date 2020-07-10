/**
 * @typedef {import('discord.js').GuildResolvable GuildResolvable
 */
/**
 * @typedef {import('discord.js').UserResolvable UserResolvable
 */
/**
 * @typedef {import('discord.js').Role Role
 */


const startRegex = /^SELF-START\((\d+)\)\|([^|\n]+)(?:\|([^|\n]*))?$/;
const endRegex = /^SELF-END\((\d+)\)$/;
const invalidGroup = Symbol('invalidGroup');
/**
 * @typedef {typeof invalidGroup} INVALID_GROUP
 */
const { FriendlyError } = require('discord.js-commando');
const bot = require('../index');
const cache = new Map();


/**
 * 
 * @param {GuildResolvable} guild - Guild to check
 * @returns {Promise<{name: string;permGroup: string;start: any;end: any;roleEntries: {role: Role; permGroup: string;}[];}[]>} The set of permission groups the user has
 */
async function getSelfRoleGroups(guild) {
  guild = bot.guilds.resolve(guild);
  if (!guild) {
    throw new Error('invalid guild');
  }
  if(cache.has(guild.id)) return cache.get(guild.id);
  /**
   * @type {Map<string, INVALID_GROUP | {name: string; permGroup: string; start: role; end: role; roleEntries: {role: Role; permGroup: string;}[];}>}}
   */
  const groups = new Map();
  const roles = (await guild.roles.fetch()).cache;
  roles.forEach(r => {
    let match;
    // eslint-disable-next-line no-cond-assign
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
      // eslint-disable-next-line no-cond-assign
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
    bot.client.emit('warn', `Self role group with id "${key}" is invalid.`);
  }
  /**
   * @type {Set<Role>}
   */
  const groupMarkers = new Set();
  groups.forEach(({start, end}) => groupMarkers.add(start).add(end));
  roles.sort((r1,r2) => r2.position - r1.position).forEach(r => {
    for(let [,group] of groups) {
      if(r.position < group.start.position && r.position > group.end.position) {
        if(groupMarkers.has(r)) throw new FriendlyError('Overlapping self-role groups. This is not good.');
        if(r.managed) {
          bot.emit('warn', `Role '${r.name}' in '${guild.name}' is managed by external service and not assignable, omitting from self-role.`);
          return;
        }
        if(r.permissions.bitfield & 0x79C0203E) {
          bot.emit('warn', `Role '${r.name}' in '${guild.name}' has dangerous permissions, omitting from self-role.`);
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
  cache.set(guild.id, groupsArr);
  return groupsArr;
}

/**
 * 
 * @param {GuildResolvable} guild - Guild to check
 * @param {UserResolvable} user - User to perform the check on
 * @returns {Promise<Set<String>>} The set of permission groups the user has
 */
async function getPermGroups(guild, user) {
  const permGroups = new Set();
  guild = bot.guilds.resolve(guild);
  if (!guild) {
    throw new Error('invalid guild');
  }
  const member = guild.members.resolve(user) || await guild.members.fetch(user).catch(() => null);
  if (!member) {
    throw new Error('invalid member');
  }
  const guildPerms = guild.settings.get('permissionRoles') || {};
  permLoop: for(const permGroupName of Object.keys(guildPerms)) {
    const permGroup = guildPerms[permGroupName];
    const roles = Array.isArray(permGroup)
      ? permGroup
      : [permGroup];
    for(const role of roles) {
      if(member.roles.cache.has(role)) {
        permGroups.add(permGroupName);
        continue permLoop;
      }
    }
  }
  return permGroups;
}

/**
 * 
 * @param {GuildResolvable} guild - Guild to check
 */
function invalidateCache(guild) {
  guild = bot.guilds.resolve(guild);
  if (!guild) {
    throw new Error('invalid guild');
  }
  cache.delete(guild.id);
}

module.exports = {
  getSelfRoleGroups,
  getPermGroups,
  invalidateCache,
};
