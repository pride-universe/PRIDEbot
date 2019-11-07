const RestrictedCommand = require('../../restrictedCommand');
const { FriendlyError } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const axios = require('axios').create({
  baseURL: 'https://api.exchangeratesapi.io/',
  timeout: 1000,
});

const cache = {};

async function getConvertedValue(val, fcur, tcur, channel) {
  val = Number.parseFloat(val);
  fcur = fcur.toUpperCase();
  tcur = tcur.toUpperCase();
  if(!cache[fcur] || Date.now() > cache[fcur].expires) {
    channel.startTyping();
    try {
      const res = await axios.get('/latest', {
        params: {
          base: fcur,
        },
      });
      const { rates } = res.data;
      if(typeof rates !== 'object') throw new TypeError(`Expected 'rates' to be an object, got '${typeof rates}'`);
      const now = Date.now();
      cache[fcur] = {
        expires: now + 1000 * 60 * 60 * 24,
        fetched: now,
        rates,
      };
      channel.stopTyping();
    } catch (err) {
      channel.stopTyping();
      if(!err.response) throw err;
      const res = err.response;
      if(!res.data || typeof res.data.error !== 'string') throw err;
      throw new FriendlyError(res.data.error);
    }
  }
  const { rates, fetched } = cache[fcur];
  if (rates[tcur] == null) {
    throw FriendlyError(`Target '${tcur}'\`' is not supported.`);
  }
  return {
    fetched,
    orgVal: val,
    value: rates[tcur]*val,
    rate: rates[tcur],
    fcur,
    tcur,
  };
}

async function makeEmbed([, val, _fcur, _tcur], channel) {
  const { fetched, rate, orgVal, value, fcur, tcur } = await getConvertedValue(val, _fcur, _tcur, channel);
  const embed = new MessageEmbed();
  embed.setDescription(`${orgVal.toFixed(2)} ${fcur} * ${rate.toFixed(3)} = ${value.toFixed(2)} ${tcur}`);
  embed.setFooter('Fetched: ');
  embed.setTimestamp(fetched);
  return embed;
}

module.exports = class Currency extends RestrictedCommand {
  constructor(client) {
    super(client, {
      name: 'currency',
      aliases: ['cur'],
      group: 'util',
      memberName: 'currency',
      description: 'Converts currency, because WolframAlpha stopped',
      examples: ['cur 1.4 usd sek', 'cur 50 sek in usd'],
      guildOnly: false,
      clientPermissions: [],
      format: '<query>',
      permGroup: 'members',
    });
  }
  async run(msg, args) {
    // msg.channel.startTyping();
    const match = args.match(/\s*(\d+|\d*.\d+|\d+.\d*)\s*([a-z]{3})\s*(?:in|to)?\s*([a-z]{3})/i);
    if (!match) return msg.reply('Did not understand your input, do `p!help currency` for help');
    return msg.reply(await makeEmbed(match, msg.channel));
  }
};
