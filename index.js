#!/usr/bin/node
require('./extensions');

const bot = require('./bot');
require('./modules/triggerWarnings');
require('./modules/spoilers');
require('./jokes/banned');

if(!process.argv.find((e)=>e==="--no-repl")) {
  const repl = require('repl');
  repl.start('> ').context.bot = bot;
}
