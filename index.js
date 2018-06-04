#!/usr/bin/node

const bot = require('./bot.js');
const router = require('./commandRouter.js');
const fs = require('fs');
const config = require('./config.json');
fs.readdir("./commands", function(err, items) {
    console.log(items);

    for (var i=0; i<items.length; i++) {
        if(!items[i].endsWith('.js')) continue;
        commandFile = items[i];
        commandFile = config.commandDir+commandFile;
        const command = items[i].substring(0,items[i].length-3);
        const commandObj = require(commandFile);
        router.registerCommand(command, commandObj);
    }
});

if(!process.argv.find((e)=>e==="--no-repl")) {
  const repl = require('repl');
  repl.start('> ').context.bot = bot;
}
