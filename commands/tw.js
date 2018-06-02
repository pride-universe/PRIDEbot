const bot = require('../bot.js');

function run (args, context) {
  console.log(context);
  bot.deleteMessage({channelID: context.channelID, messageID: context.event.d.id })
  bot.sendMessage({
    to: context.channelID,
    message: "<@"+context.userID+"> sent a message which may be triggering.",
    embed: {
      "author": {
        "name": context.user,
        "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
      },
      "description": "this supports [named links](https://discordapp.com) on top of the previously shown subset of markdown. ```\nyes, even code blocks```",
    },
  });
}

module.exports = {
  run,
}
