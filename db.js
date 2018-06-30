const sqlite = require('sqlite');
var db;
async function initDB () {
  db = await sqlite.open('./main.sqlite', { Promise });
  return db;
}
var promise = initDB();

function getDBInstance() {
  if(!db) throw new Error('Database is not yet open!');
  return db;
}

getDBInstance.dbPromise = promise;

module.exports = getDBInstance;
