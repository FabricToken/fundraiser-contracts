'use strict';

import expectThrow from './helpers/expectThrow';
import advanceBlock from './helpers/advanceBlock';
import latestTimestamp from './helpers/latestTimestamp';

const FabricToken = artifacts.require("./FabricToken.sol");
const TokenSafeUT = artifacts.require("./testing/TokenSafeUT.sol");
const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();


contract('TokenSafe', function (accounts) {
    const CORE_TEAM = 0;
    const allocatedLockedTokens = new BigNumber("1000000");
    let now, oneDayBefore, oneDayAfter, twoDaysAfter;
    let token;
    let safe;

    function updateTimestamps() {
        now = latestTimestamp();
        oneDayBefore = now - 24 * 3600;
        oneDayAfter = now + 24 * 3600;
        twoDaysAfter = now + 24 * 3600;
    }

    before(async function () {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock();
        updateTimestamps();
    });

    describe('unit testing the TokenSafe trait', function () {
        beforeEach(async function () {
            token = await FabricToken.new(allocatedLockedTokens);
            safe = await TokenSafeUT.new(token.address);
        });

        it('should set the exact release date using initBundle()', async function () {
            await safe.internalInitBundle(CORE_TEAM, oneDayBefore);
            let bundleCore = await safe.bundles.call(CORE_TEAM);
            let coreTeamReleaseTimestamp = bundleCore[1];
            coreTeamReleaseTimestamp.should.be.bignumber.equal(oneDayBefore);
        });

        it('should be able to transfer locked token to core member', async function () {
            // Set up the TokenSafe
            await safe.internalInitBundle(CORE_TEAM, oneDayBefore);
            await safe.internalAddLockedAccount(CORE_TEAM, accounts[0], new BigNumber("700000"));
            await safe.internalAddLockedAccount(CORE_TEAM, accounts[1], new BigNumber("300000"));

            let internalBalanceAccount0 = await safe.internalBalanceOf.call(0, accounts[0]);
            internalBalanceAccount0.should.be.bignumber.equal("700000");
            let internalBalanceAccount1 = await safe.internalBalanceOf.call(0, accounts[1]);
            internalBalanceAccount1.should.be.bignumber.equal("300000");

            // Finalize fundraiser
            await token.transfer(safe.address, allocatedLockedTokens);
            // Verify that the tokens are transferred to the safe so they can be released.
            let safeTokenBalance = await token.balanceOf.call(safe.address);
            safeTokenBalance.should.be.bignumber.equal(allocatedLockedTokens);

            // Release tokens
            await safe.internalReleaseAccount(CORE_TEAM, accounts[0]);
            (await token.balanceOf.call(accounts[0])).should.be.bignumber.equal("700000");
        });

        it('should throw an error if the fundraiser has not not transfered the total number of locked tokens for the safe', async function () {
            // Set up the TokenSafe
            await safe.internalInitBundle(CORE_TEAM, oneDayBefore);
            await safe.internalAddLockedAccount(CORE_TEAM, accounts[0], new BigNumber("1000"));

            let internalBalanceAccount0 = await safe.internalBalanceOf.call(0, accounts[0]);
            internalBalanceAccount0.should.be.bignumber.equal("1000");

            // Finalize fundraiser
            let notEnoughTokens = new BigNumber("900");
            await token.transfer(safe.address, notEnoughTokens);

            // Release tokens and expect throw
            await expectThrow(safe.internalReleaseAccount(CORE_TEAM, accounts[0]));
        });

        it('should deduct the correct amount of tokens from the locked accounts', async function () {
            // Set up the TokenSafe
            await safe.internalInitBundle(CORE_TEAM, oneDayBefore);
            await safe.internalAddLockedAccount(CORE_TEAM, accounts[0], 1000);

            let internalBalanceAccount0 = await safe.internalBalanceOf.call(0, accounts[0]);
            internalBalanceAccount0.should.be.bignumber.equal(1000);

            // Finalize fundraiser
            await token.transfer(safe.address, 1000);

            // Release tokens and expect throw
            await safe.internalReleaseAccount(CORE_TEAM, accounts[0]);

            // Check balance of the locked account and bundle core
            internalBalanceAccount0 = await safe.internalBalanceOf.call(0, accounts[0]);
            internalBalanceAccount0.should.be.bignumber.equal(0);
            let [lockedTokens, releaseTimestamp] = await safe.bundles.call(CORE_TEAM);
            lockedTokens.should.be.bignumber.equal(0);
        });

        it('should not allow unlocking an account not present in the locked token bundle', async function () {
            // Set up the TokenSafe
            await safe.internalInitBundle(CORE_TEAM, oneDayBefore);
            await safe.internalAddLockedAccount(CORE_TEAM, accounts[1], 1000);
            await expectThrow(safe.internalReleaseAccount(CORE_TEAM, accounts[2]));
        });
    });
});
