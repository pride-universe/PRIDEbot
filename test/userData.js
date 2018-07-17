/* eslint-env node, mocha */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should(); // eslint-disable-line no-unused-vars
//const expect = chai.expect;

var db = null;

async function getCleanDb() {
  if(db) await db.clear();
  delete require.cache[require.resolve('./modules/db')];
  db = require('./modules/db');
  const resolved = require.resolve('../src/db');
  require.cache[resolved] = require.cache[require.resolve('./modules/db')];
  return db;
}

describe('userData', function () {
  let userData;
  after(function() {
    if(db) return db.clear();
  });
  describe('#setData(user, data)', function () {
    before(async function() {
      db = await getCleanDb();
      delete require.cache[require.resolve('../src/modules/userData')];
      userData = require('../src/modules/userData');
      return db;
    });
    it('user: 1234, data: null', function () {
      return userData.setData('12345', null).should.be.rejected;
    });
    it('user: 1234, data: undefined', function () {
      return userData.setData('12345', undefined).should.be.rejected;
    });
    it('user: 1234, data: numeric', function () {
      return userData.setData('12345', 1234).should.be.rejected;
    });
    it('user: 1234, data: non-empty string', function () {
      return userData.setData('12345', 'aoeu').should.be.rejected;
    });
    it('user: 1234, data: empty string', function () {
      return userData.setData('12345', '').should.be.rejected;
    });
    it('user: 1234, data: array', function () {
      return userData.setData('12345', []).should.be.rejected;
    });
    it('user: 1234, data: Function<undefined>', function () {
      return userData.setData('12345', ()=>{}).should.be.rejected;
    });
    it('user: notAUser, data: empty object', function () {
      return userData.setData('notAUser', {}).should.be.rejected;
    });
    it('user: Function<undefined>, data: empty object', function () {
      return userData.setData(()=>{}, {}).should.be.rejected;
    });

    it('user: 1234, data: Function<Object>', function () {
      return userData.setData('1234', ()=>({})).should.be.fulfilled;
    });
    it('user: Function<1234>, data: object', function () {
      return userData.setData(()=>'1234', {}).should.be.fulfilled;
    });
    it('user: Function<Promise<1234>>, data: object', function () {
      return userData.setData(()=>Promise.resolve('1234'), {aoeu: 1234}).should.be.fulfilled;
    });
  });

  describe('#getData(user)', function () {
    before(async function() {
      db = await getCleanDb();
      delete require.cache[require.resolve('../src/modules/userData')];
      userData = require('../src/modules/userData');
      return db;
    });
    it('user: notAUser', function () {
      return userData.getData('notAUser').should.be.rejected;
    });
    it('user: undefined', function () {
      return userData.getData(undefined).should.be.rejected;
    });
    it('user: null', function () {
      return userData.getData(null).should.be.rejected;
    });
    it('user: 1234', function () {
      return userData.getData('1234').should.become({});
    });
    it('user: 1234, with data', async function () {
      await userData.setData('1234', {foo: 'bar'});
      return await userData.getData('1234').should.become({foo: 'bar'});
    });
  });

  describe('#setProp(user, prop, value)', function () {
    before(async function() {
      db = await getCleanDb();
      delete require.cache[require.resolve('../src/modules/userData')];
      userData = require('../src/modules/userData');
      return db;
    });
    it('user: notAUser, prop: dummy', function () {
      return userData.setProp('notAUser', 'dummy').should.be.rejected;
    });
    it('user: undefined, prop: dummy', function () {
      return userData.setProp(undefined, 'dummy').should.be.rejected;
    });
    it('user: null, prop: dummy', function () {
      return userData.setProp(null, 'dummy').should.be.rejected;
    });
    it('user: 1234, prop: null', function () {
      return userData.setProp('1234', null).should.be.rejected;
    });
    it('user: 1234, prop: undefined', function () {
      return userData.setProp('1234', undefined).should.be.rejected;
    });
    it('user: 1234, prop: object', function () {
      return userData.setProp('1234', {}).should.be.rejected;
    });
    it('user: 1234, prop: array', function () {
      return userData.setProp('1234', []).should.be.rejected;
    });
    it('user: 1234, prop: dummy', function () {
      return userData.setProp('1234', 'dummy').should.be.fulfilled;
    });
  });

  describe('#getProp(user, prop, default)', function () {
    before(async function() {
      db = await getCleanDb();
      delete require.cache[require.resolve('../src/modules/userData')];
      userData = require('../src/modules/userData');
      return db;
    });
    it('user: notAUser, prop: dummy', function () {
      return userData.getProp('notAUser', 'dummy').should.be.rejected;
    });
    it('user: undefined, prop: dummy', function () {
      return userData.getProp(undefined, 'dummy').should.be.rejected;
    });
    it('user: null, prop: dummy', function () {
      return userData.getProp(null, 'dummy').should.be.rejected;
    });
    it('user: 1234, prop: null', function () {
      return userData.getProp('1234', null).should.be.rejected;
    });
    it('user: 1234, prop: undefined', function () {
      return userData.getProp('1234', undefined).should.be.rejected;
    });
    it('user: 1234, prop: object', function () {
      return userData.getProp('1234', {}).should.be.rejected;
    });
    it('user: 1234, prop: array', function () {
      return userData.getProp('1234', []).should.be.rejected;
    });
    it('user: 1234, prop: dummy', function () {
      return userData.getProp('1234', 'dummy').should.become(undefined);
    });
    it('user: 1234, prop: dummy, default: test', function () {
      return userData.getProp('1234', 'dummy', 'test').should.become('test');
    });
    it('user: 1234, prop: dummy - with data: 12', async function () {
      await userData.setProp('1234', 'dummy', 12).should.be.fulfilled;
      return await userData.getProp('1234', 'dummy').should.become(12);
    });
    it('user: 1234, prop: dummy, default: test - with data: undefined', async function () {
      await userData.setProp('1234', 'dummy', undefined).should.be.fulfilled;
      return await userData.getProp('1234', 'dummy', 'test').should.become(undefined);
    });
    it('user: 1234, prop: dummy, default: false - with data: true', async function () {
      await userData.setProp('1234', 'dummy', true).should.be.fulfilled;
      return await userData.getProp('1234', 'dummy', false).should.become(true);
    });
  });
});
