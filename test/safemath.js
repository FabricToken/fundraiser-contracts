'use strict';

import expectThrow from './helpers/expectThrow';
const SafeMathUT = artifacts.require("./testing/SafeMathUT.sol");
const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('SafeMath [library]', function (accounts) {
    let lib;

    before(async function() {
        lib = await SafeMathUT.new();
    })

    it('should be able to add numbers correctly', async function() {
        let result = await lib.plus.call(1, 2);
        assert.equal(result, 3);
    });
    
    it('should throw an exception when overflow on addition', async function() {
        let a = new BigNumber(2).pow(256);
        await expectThrow(lib.plus(a, 1));
    });

    it('should be able to subtract numbers correctly', async function() {
        let result = await lib.minus.call(2, 1);
        assert.equal(result, 1);
    });
    
    it('should not allow the subtraction a - b if a < b, i.e. underflow', async function() {
        await expectThrow(lib.minus(1, 2));
    });

    it('should be able to multiple numbers correctly', async function() {
        let result = await lib.mul.call(2, 3);
        assert.equal(result, 6);
    });
    
    it('should be able to multiple by zero correctly, e.g. 0 * 3 == 0', async function() {
        let result = await lib.mul.call(0, 3);
        assert.equal(result, 0);
    });

    it('should be able to multiple by zero correctly, e.g. 3 * 0 == 0', async function() {
        let result = await lib.mul.call(3, 0);
        assert.equal(result, 0);
    });


    it('should throw an exception when overflow on multiplication', async function() {
        let a = new BigNumber(2).pow(256);
        await expectThrow(lib.mul(a, 2));
    });

    it('should be able to divide numbers correctly', async function() {
        let result = await lib.div.call(6, 2);
        assert.equal(result, 3);
    });

    it('should return the integer value of the division if there is reminder', async function() {
        let result = await lib.div.call(7, 2);
        assert.equal(result, 3);
    });

    it('should return zero if divider is larger than the dividend', async function() {
        let result = await lib.div.call(3, 4);
        assert.equal(result, 0);
    });

    it('should throw an exception when dividing by zero', async function() {
        await expectThrow(lib.div(1, 0));
    });
});
