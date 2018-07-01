const sqlite = require('sqlite');
const fs = require('fs');

var db;

async function clearOldDb () {
  async function remove(depth) {
    if(db) {
      try {
        await db.close();
      } catch (e) {
        // continue regardless of error
      }
    }
    try {
      fs.unlinkSync('./main.test.sqlite');
    } catch (e) {
      if(e.code === 'ENOENT') {
        return;
      }
      if((e.code === 'EBUSY' || e.code === 'EPERM') && depth < 500) {
        await new Promise(resolve=>setTimeout(resolve, 10));
        return await remove(depth+1);
      }
      throw e;
    }
  }
  return await remove(0);
}

async function initDB () {
  clearOldDb();
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
getDBInstance.clear = clearOldDb;
module.exports = getDBInstance;
