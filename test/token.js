'use strict';

import expectThrow from './helpers/expectThrow';
const FabricToken = artifacts.require("./FabricToken.sol");

contract('FabricToken', function (accounts) {
  let token;

  beforeEach(async function() {
    token = await FabricToken.new(100);
  });

  it('should return the correct totalSupply after construction', async function() {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 100);
  });

  describe('transfer operations', function() {
    it("should return correct balances after transfer", async function(){
      let transfer = await token.transfer(accounts[1], 100);

      let firstAccountBalance = await token.balanceOf(accounts[0]);
      assert.equal(firstAccountBalance, 0);

      let secondAccountBalance = await token.balanceOf(accounts[1]);
      assert.equal(secondAccountBalance, 100);
    });

    it("should return failed transfer when trying to transfer more than balance", async function() {
      let transfer = await token.transfer.call(accounts[1], 101);
      assert.equal(transfer, false, 'should return failed transfer')
    });

    it('should return correct balances after transfer', async function() {
      await token.transfer(accounts[1], 100);
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 0);

      let balance1 = await token.balanceOf(accounts[1]);
      assert.equal(balance1, 100);
    });

    it('should not allow zero tokens transfer', async function() {
      let transfer = await token.transfer.call(accounts[1], 0);
      assert.equal(transfer, false, 'should return failed transfer')
    });
  });

  describe('delegated transfer operations (allowance, approve and transferFrom)', function () {
    it('should return the correct allowance after approval', async function() {
      await token.approve(accounts[1], 100);
      let allowance = await token.allowance(accounts[0], accounts[1]);

      assert.equal(allowance, 100);
    });

    it('should return a failure when trying to transfer more than balance', async function() {
      let transfer = await token.transfer.call(accounts[1], 101);
      assert.equal(transfer, false, 'should be a failed transfer');
    });

    it('should return correct balances after transfering from another account', async function() {
      await token.approve(accounts[1], 100);
      await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});

      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 0);

      let balance1 = await token.balanceOf(accounts[2]);
      assert.equal(balance1, 100);

      let balance2 = await token.balanceOf(accounts[1]);
      assert.equal(balance2, 0);
    });

    it('should return an error when trying to transfer more than allowed', async function() {
      await token.approve(accounts[1], 99);
      let transfer = await token.transferFrom.call(accounts[0], accounts[2], 100, {from: accounts[1]});
      assert.equal(transfer, false, 'should return a failed transfer')
    });

    it('should not allow zero tokens transferFrom', async function () {
      await token.approve(accounts[1], 100);
      let transfer = await token.transferFrom.call(accounts[0], accounts[2], 0, {from: accounts[1]});
      assert.equal(transfer, false, 'should return failed transfer')
    });
  });
});

