const bot = require('../bot.js');

const channels = [
  '389948829295837185',
  '390235784956870656',
  '456591307511693327',
  '448171713444708364',
];
const keyword = 'banned';

const cooldown = '1200';

const staffroles = [
  '399326671058108417',
  '456596094546345984',
  '450731626788290560',
];

let lastMessage = 0;

bot.on('message', async msg => {
  if (lastMessage+cooldown*1000>Date.now()) return;
  if (msg.author.id === bot.user.id) return;
  if (!channels.includes(msg.channel.id)) return;
  if (!msg.content.toLowerCase().includes(keyword)) return;
  const roles = (await msg.channel.guild.members.fetch(msg)).roles;
  for(let role of roles.keys()) {
    if (staffroles.includes(role)) return;
  }
  lastMessage = Date.now();
  msg.channel.send('NO U BANNED! OwO');
});
