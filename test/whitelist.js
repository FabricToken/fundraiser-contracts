'use strict';

import expectThrow from './helpers/expectThrow';
const Whitelist = artifacts.require("./traits/Whitelist.sol");


contract('Whitelist', function (accounts) {
  let whitelist;

  beforeEach(async function () {
    whitelist = await Whitelist.new(accounts[0]);
  });

  it("should have an owner", async function () {
    const originalOwner = accounts[0];
    let owner = await whitelist.owner();
    assert.equal(owner, originalOwner, "contract owner should be the first account");
  });

  it("non-owner should not be able to whitelist", async function () {
    await expectThrow(whitelist.whitelistAddresses(
      [accounts[1], accounts[2]],
      {from: accounts[1]})
    );
  });

  it("owner should be able to whitelist multiple entries", async function () {
    await whitelist.whitelistAddresses([accounts[1], accounts[2]]);
    assert.equal(await whitelist.whitelist.call(accounts[1]), true);
    assert.equal(await whitelist.whitelist.call(accounts[2]), true);
  });

  it("owner should be able to blacklist multiple entries", async function () {
    await whitelist.whitelistAddresses([
      accounts[1],
      accounts[2],
      accounts[3],
    ]);
    await whitelist.blacklistAddresses([
      accounts[1],
      accounts[2],
    ]);
    assert.equal(await whitelist.whitelist.call(accounts[1]), false);
    assert.equal(await whitelist.whitelist.call(accounts[2]), false);
    assert.equal(await whitelist.whitelist.call(accounts[3]), true);
  });
});
