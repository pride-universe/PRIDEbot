const commando = require('discord.js-commando');
const { stripIndents } = require('common-tags');
const userData = require('../../modules/userData');

module.exports = class AllowVoiceCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'allowvoice',
      aliases: [],
      group: 'privacy',
      memberName: 'allowvoice',
      description: 'Enables or disables wether the bot should be allowed in the same voice channel as you. Defaults to enabled',
      examples: ['allowvoice enable', 'allowvoice disable', 'allowvoice on', 'allowvoice off'],
      guildOnly: false,
      clientPermissions: [],
      args: [
        {
          key: 'value',
          label: 'on/off',
          prompt: 'Would you like to turn voice co-existance on or off with the bot?',
          type: 'boolean',
          default: async msg => !(await userData.getProp(msg, 'allowVoice', true)),
        },
      ],
    });
  }
  async run(msg, args) {
    userData.setProp(msg, 'allowVoice', args.value);
    if(args.value) {
      return msg.reply('I will now stop avoiding you in voice channels.');
    } else {
      this.client.plugins.get('voiceprivacy').forceRecheck(msg.client);
      return msg.reply(stripIndents`I'll avoid you in voice channels as long as you are unmuted.
      If you have your microphone muted I'll join and stay in a voice channel as long as you are muted. I'll leave as soon as you unmute your microphone if I happen to be in the voice channel at the time.`);
    }
  }
};
