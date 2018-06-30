const sqlite = require('sqlite');
const fs = require('fs');

var db;
async function initDB () {
  fs.unlinkSync('./main.test.sqlite');
  db = await sqlite.open('./main.test.sqlite', { Promise });
  const query = fs.readFileSync('./schema.sql',{encoding:'utf8'});
  await db.exec(query);
  return db;
}
var promise = initDB();

function getDBInstance() {
  if(!db) throw new Error('Database is not yet open!');
  return db;
}

getDBInstance.dbPromise = promise;

module.exports = getDBInstance;
