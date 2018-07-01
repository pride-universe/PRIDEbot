#!/usr/bin/node
require('./extensions');

const bot = require('./bot');
require('./modules/triggerWarnings');
require('./modules/spoilers');
//require('./jokes/banned');
require('./jokes/cultTracker');

module.exports = bot;
