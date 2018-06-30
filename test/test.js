const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();
//const expect = chai.expect;
const db = require('./db');

const resolved = require.resolve('../db');
require.cache[resolved] = require.cache[require.resolve('./db')];

describe('userData', function () {
  let userData = require('../modules/userData');
  describe('setData(user, data)', function () {
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
});
