const Discord = require('discord.io');
const secrets = require('./secrets.json');
const config = require('./config.json');
const router = require('./commandRouter.js');

const bot = new Discord.Client({
  token: secrets.discordToken,
  autorun: true
});

function tokenize (message) {
  return message.split(" ");
}

function parseMessage(user, userID, channelID, message, event) {
  let isCommand = false;
  let prefixLength = -1;
  for(let prefix of config.prefix) {
    if(message.toLowerCase().startsWith(prefix)) {
      isCommand = true;
      if(prefix.length > prefixLength) prefixLength = prefix.length;
    }
  }

  if (isCommand) {
    message = message.substring(prefixLength);
    let args = tokenize(message);
    let command = args[0];
    router.route(command, args, {user, userID, channelID, message, event});
  }
}

bot.on('ready', function() {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
  bot.getAllUsers();
  setInterval(()=>bot.getAllUsers(), config.updateUsersInterval);
});

bot.on('message', parseMessage);

bot.on('allUsers', ()=>bot.setPresence({game: {name: Object.keys(bot.users).length+" users", type: 3}}));

bot.on('disconnect', console.log);

//bot.on('guildMemberUpdate', console.log);

module.exports = bot;
