#!/usr/bin/node

const bot = require('./bot.js');
require('./modules/triggerWarnings');
require('./jokes/banned.js');

if(!process.argv.find((e)=>e==="--no-repl")) {
  const repl = require('repl');
  repl.start('> ').context.bot = bot;
}
