const sqlite = require('sqlite');
var db;
async function initDB () {
  db = await sqlite.open('./main.sqlite', { Promise });
}
initDB();

function getDBInstance() {
  if(!db) throw new Error('Database is not yet open!');
  return db;
}

module.exports = getDBInstance;
