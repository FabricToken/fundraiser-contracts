'use strict';

import expectThrow from './helpers/expectThrow';
const FabricToken = artifacts.require("./FabricToken.sol");

contract('FabricToken [HasOwner()]', function (accounts) {
    let token;

    beforeEach(async function () {
        token = await FabricToken.new();
    });

    it("should have an owner", async function () {
        const originalOwner = accounts[0];
        let owner = await token.owner();
        assert.equal(owner, originalOwner, "contract owner should be the first account");
    });

    it("should be able to transfer ownership to a new owner", async function () {
        const originalOwner = accounts[0],
            newOwner = accounts[1];

        await token.transferOwnership(newOwner, { from: originalOwner });
        let _newOwner = await token.newOwner.call();
        assert.equal(_newOwner, newOwner, "conditional new owner should be set");
        let result = await token.acceptOwnership({ from: newOwner })

        let events = result.logs, event = events[0];
        assert.equal(events.length, 1, "there should be just 1 event");
        assert.equal(event.args._oldOwner, originalOwner, "transfer should be from the original owner");
        assert.equal(event.args._newOwner, newOwner, "transfer should be to the new owner");

        let _owner = await token.owner.call();
        assert.equal(_owner, newOwner, "ownership should be transferred");
    });

    it("should not start transfer from different account than the owner", async function () {
        const anotherAccount = accounts[2];
        await expectThrow(token.transferOwnership(anotherAccount, { from: anotherAccount }));
    });

    it("should not accept owenership from different account than the newOwner", async function () {
        const originalOwner = accounts[0],
            newOwner = accounts[1],
            anotherAccount = accounts[2];

        await token.transferOwnership(newOwner, { from: originalOwner });
        let _newOwner = await token.newOwner.call();
        assert.equal(_newOwner, newOwner, "conditional new owner should be set");
        await expectThrow(token.acceptOwnership({ from: anotherAccount }));
    });
});
