const { Collection } = require('discord.js');
const Module = require('./module');
const ModuleGroup = require('./moduleGroup');

class ModuleManager {
  /** @param {CommandoClient} client - Client to use  */
  constructor(client) {
    /**
     * The client that instantiated this
     * @name ModuleManager#client
     * @type {CommandoClient}
     * @readonly
     */
    Object.defineProperty(this, 'client', { value: client });

    /**
     * The client that instantiated this
     * @name CommandoClient#modules
     * @type {ModuleManager}
     * @readonly
     */
    Object.defineProperty(client, 'modules', { value: this });

    /**
     * Registered modules
     * @type {Collection<string, Module>}
     */
    this.modules = new Collection();

    /**
     * Registered module groups
     * @type {Collection<string, ModuleGroup>}
     */
    this.groups = new Collection();

    /**
		 * Fully resolved path to the bot's modules directory
		 * @type {?string}
		 */
    this.modulesPath = null;
  }

  /**
   * Registers a single group
   * @param {ModuleGroup|Function|Object|string} group - A ModuleGroup instance, a constructor, or the group ID
   * @param {string} [name] - Name for the group (if the first argument is the group ID)
   * @param {boolean} [guarded] - Whether the group should be guarded (if the first argument is the group ID)
   * @return {ModuleManager}
   * @see {@link ModuleManager#registerGroups}
   */
  registerGroup(group, name, guarded) {
    if(typeof group === 'string') {
      group = new ModuleGroup(this.client, group, name, guarded);
    } else if(typeof group === 'function') {
      group = new group(this.client); // eslint-disable-line new-cap
    } else if(typeof group === 'object' && !(group instanceof ModuleGroup)) {
      group = new ModuleGroup(this.client, group.id, group.name, group.guarded);
    }

    const existing = this.groups.get(group.id);
    if(existing) {
      existing.name = group.name;
      this.client.emit('debug', `Module group ${group.id} is already registered; renamed it to "${group.name}".`);
    } else {
      this.groups.set(group.id, group);
      /**
       * Emitted when a group is registered
       * @event CommandoClient#modGroupRegister
       * @param {ModuleGroup} group - Group that was registered
       * @param {ModuleManager} manager - Registry that the group was registered to
       */
      this.client.emit('modGroupRegister', group, this);
      this.client.emit('debug', `Registered module group ${group.id}.`);
    }

    return this;
  }

  /**
   * Registers multiple groups
   * @param {ModuleGroup[]|Function[]|Object[]|Array<string[]>} groups - An array of ModuleGroup instances,
   * constructors, plain objects (with ID, name, and guarded properties),
   * or arrays of {@link ModuleManager#registerGroup} parameters
   * @return {ModuleManager}
   * @example
   * modules.registerGroups([
   * 	['fun', 'Fun'],
   * 	['mod', 'Moderation']
   * ]);
   * @example
   * modules.registerGroups([
   * 	{ id: 'fun', name: 'Fun' },
   * 	{ id: 'mod', name: 'Moderation' }
   * ]);
   */
  registerGroups(groups) {
    if(!Array.isArray(groups)) throw new TypeError('Groups must be an Array.');
    for(const group of groups) {
      if(Array.isArray(group)) this.registerGroup(...group);
      else this.registerGroup(group);
    }
    return this;
  }

  /**
   * Loads a single module
   * @param {Module|Function} module - a constructor for a Module
   * @return {ModuleManager}
   * @see {@link ModuleManager#loadModules}
   */
  loadModule(module) {
    if(typeof module === 'function') module = new module(this.client);
    if(!(module instanceof Module)) throw new Error(`Invalid module constructor to load: ${module}`);

    // Make sure there aren't any conflicts
    if(this.modules.some(mod => mod.name === module.name)) {
      throw new Error(`A module with the name "${module.name}" is already registered.`);
    }
  }

  /**
   * Loads a single module
   * @param {Module[]|Function[]} modules - a constructor for a Module
   * @param {boolean} [ignoreInvalid=false] - Whether to skip over invalid modules without throwing an error
   * @return {ModuleManager}
   * @see {@link ModuleManager#registerModules}
   */
  loadModules(modules, ignoreInvalid = false) {
    if(!Array.isArray(modules)) throw new TypeError('Modules must be an Array.');
    for(const module of modules) {
      if(ignoreInvalid && typeof module !== 'function' && !(module instanceof Module)) {
        this.client.emit('warn', `Attempting to register an invalid module object: ${module}; skipping.`);
        continue;
      }
      this.loadModule(module);
    }
    return this;
  }
}

module.exports=ModuleManager;
