const base = require('./config');

const env = process.env.NODE_ENV;

let localConf = {};
try {
  localConf = require('./config.local');
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err;
  }
}

let envConf = {};
let localEnvConf = {};

if (env) {
  try {
    envConf = require(`./config.${env}`);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err;
    }
  }
  try {
    localEnvConf = require(`./config.${env}.local`);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err;
    }
  }
}
const conf = Object.assign({}, base, envConf, localConf, localEnvConf);
console.log(conf);
module.exports = conf;