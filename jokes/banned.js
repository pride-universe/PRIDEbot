const bot = require('../bot.js');

const channels = [
  '389948829295837185',
  '390235784956870656',
  '448171713444708364',
];
const keyword = "banned";

const cooldown = "1200";

const staffroles = [
  '399326671058108417',
  '450731626788290560',
];

let lastMessage = 0;

bot.on('message', (user, userID, channelID, message, event) => {
  if (lastMessage+cooldown*1000>Date.now()) return;
  if (userID === bot.id) return;
  if (!channels.includes(channelID)) return;
  if (!message.toLowerCase().includes(keyword)) return;
  const roles = bot.servers[event.d.guild_id].members[userID].roles;
  for(let role of roles) {
    if (staffroles.includes(role)) return;
  }
  lastMessage = Date.now();
  bot.sendMessage({to: channelID, message: "NO U BANNED! OwO"});
});
