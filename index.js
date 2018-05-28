const secrets = require('./secrets.json');

var Discord = require('discord.io');

function parseMessage(user, userID, channelID, message, event) {
  if (message === "ping") {
    bot.sendMessage({
      to: channelID,
      message: "pong"
    });
  }
}

var bot = new Discord.Client({
  token: secrets.discordToken,
  autorun: true
});

bot.on('ready', function() {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('message', parseMessage);
