'use strict';

const FabricToken = artifacts.require("./FabricToken.sol");

contract('FabricToken [General]', function (accounts) {
  let token;

  it("should have all parameters set correctly", async function () {
    token = await FabricToken.new(0);

    let name = await token.name.call();
    assert.equal(name, 'Fabric Token', "incorrect name");

    let symbol = await token.symbol.call();
    assert.equal(symbol, 'FT', "incorrect symbol");

    let decimals = await token.decimals.call();
    assert.equal(decimals, 18, "decimals should match ETH decimals (wei)");
  });

  it("should have 10000 Fabric Tokens in the first account in the deployed contract", async function () {
    token = await FabricToken.deployed();

    let balance = await token.balanceOf.call(accounts[0]);
    assert.equal(balance, 10000, "10000 wasn't in the first account");

    let totalSupply = await token.totalSupply.call();
    assert.equal(totalSupply, 10000, "total supply should equal the owner account balance 10000 ");
  });

  it("should put 10000 FabricToken in owner account when new contract is created", async function () {
    token = await FabricToken.new(10000);

    let owner = await token.owner.call();
    assert.equal(owner, accounts[0], "owner should be the first account");

    let balance = await token.balanceOf.call(owner);
    assert.equal(balance, 10000, "10000 should be in the owner's account");

    let totalSupply = await token.totalSupply.call();
    assert.equal(totalSupply, 10000, "total supply should equal the owner account balance 10000 ");
  });

  it("should send coin correctly", function () {
    let token;

    // Get initial balances of first and second account.
    let account_one = accounts[0];
    let account_two = accounts[1];

    let account_one_starting_balance;
    let account_two_starting_balance;
    let account_one_ending_balance;
    let account_two_ending_balance;

    let tokens = 10;

    return FabricToken.deployed().then(function (instance) {
      token = instance;
      return token.balanceOf.call(account_one);
    }).then(function (balance) {
      account_one_starting_balance = balance.toNumber();
      return token.balanceOf.call(account_two);
    }).then(function (balance) {
      account_two_starting_balance = balance.toNumber();
      return token.transfer(account_two, tokens, { from: account_one });
    }).then(function () {
      return token.balanceOf.call(account_one);
    }).then(function (balance) {
      account_one_ending_balance = balance.toNumber();
      return token.balanceOf.call(account_two);
    }).then(function (balance) {
      account_two_ending_balance = balance.toNumber();

      assert.equal(account_one_ending_balance, account_one_starting_balance - tokens, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance + tokens, "Amount wasn't correctly sent to the receiver");
    });
  });
});
