'use strict';

import expectThrow from './helpers/expectThrow';
import advanceBlock from './helpers/advanceBlock';
import advanceTime from './helpers/advanceTime';
import latestTimestamp from './helpers/latestTimestamp';
const FabricToken = artifacts.require("./FabricToken.sol");
const FabricTokenSafe = artifacts.require("./FabricTokenSafe.sol");
const TokenSafeUT = artifacts.require("./testing/TokenSafeUT.sol");
const FundraiserUT = artifacts.require("./testing/FundraiserUT.sol");
const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should()


contract('TokenSafe', function (accounts) {
    const CORE_TEAM = 0,
        ADVISORS = 1;
    const initialConversionRate = 3000;
    const hardCap = 10 ** 5;
    const allocatedLockedTokens = new BigNumber("1000000");
    let now, oneDayBefore, oneDayAfter, twoDaysAfter;
    let token;
    let safe;

    before(async function () {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock()
        now = latestTimestamp();
        oneDayBefore = now - 24 * 3600;
        oneDayAfter = now + 24 * 3600;
        twoDaysAfter = now + 24 * 3600;
    })

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

    describe('integration testing the FabricTokenSafe using FundraiserUT', function () {
        const decimalsFactor = new BigNumber(10).pow(18);
        const millionFactor = new BigNumber(10).pow(6);
        const totalSupply = new BigNumber(19).mul(millionFactor).mul(decimalsFactor);

        let coreTeamAccounts = [
            ["0x9E1Ef1eC212F5DFfB41d35d9E5c14054F26c6560", new BigNumber(4).mul(millionFactor).mul(decimalsFactor)],
            ["0xce42bdB34189a93c55De250E011c68FaeE374Dd3", new BigNumber(4).mul(millionFactor).mul(decimalsFactor)],
            ["0x97A3FC5Ee46852C1Cf92A97B7BaD42F2622267cC", new BigNumber(4).mul(millionFactor).mul(decimalsFactor)],
        ];

        let advisorsAccounts = [
            ["0xB9dcBf8A52Edc0C8DD9983fCc1d97b1F5d975Ed7", new BigNumber(2).mul(millionFactor).mul(decimalsFactor)],
            ["0x26064a2E2b568D9A6D01B93D039D1da9Cf2A58CD", new BigNumber(1).mul(millionFactor).mul(decimalsFactor)],
            ["0xe84Da28128a48Dd5585d1aBB1ba67276FdD70776", new BigNumber(1).mul(millionFactor).mul(decimalsFactor)],
            ["0xCc036143C68A7A9a41558Eae739B428eCDe5EF66", new BigNumber(1).mul(millionFactor).mul(decimalsFactor)],
            ["0xE2b3204F29Ab45d5fd074Ff02aDE098FbC381D42", new BigNumber(1).mul(millionFactor).mul(decimalsFactor)],
            ["0x5D82c01e0476a0cE11C56b1711FeFf2d80CbB8B6", new BigNumber(1).mul(millionFactor).mul(decimalsFactor)],
        ];


        beforeEach(async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, now, hardCap);
            safe = FabricTokenSafe.at(await token.fabricTokenSafe.call());
            // Finalize fundraiser
            await token.finalize();
            assert.isTrue(await token.finalized.call());
        });

        it('should alllow the release of advisors\' locked tokens not before the release date', async function () {
            let [, releaseDate] = await safe.bundles.call(ADVISORS);
            if (now > releaseDate.toNumber()) {
                assert.fail(0, 0, 'The release date for the advisors has already passed');
            }
            // Before the release date
            for (var [address,] of advisorsAccounts) {
                await expectThrow(safe.releaseAdvisorsAccount({ from: address }));
            }

            // Move after the release date
            advanceTime(releaseDate - now + 100);

            // Release all advisors' locked accounts
            for (var [address, amount] of advisorsAccounts) {
                await safe.releaseAdvisorsAccount({ from: address });
                let accountBalance = await token.balanceOf.call(address);
                accountBalance.should.be.bignumber.equal(amount);
            }

            let [lockedTokens,] = await safe.bundles.call(ADVISORS);
            lockedTokens.should.be.bignumber.equal(0);
        });

        it('should alllow the release of advisors\' locked tokens not before the release date', async function () {
            let [, releaseDate] = await safe.bundles.call(CORE_TEAM);
            if (now > releaseDate.toNumber()) {
                assert.fail(0, 0, 'The release date for the core team has already passed');
            }
            // Before the release date
            for (var [address,] of coreTeamAccounts) {
                await expectThrow(safe.releaseCoreTeamAccount({ from: address }));
            }

            // Move after the release date
            advanceTime(releaseDate - now + 100);

            // Release all core team locked accounts
            for (var [address, amount] of coreTeamAccounts) {
                await safe.releaseCoreTeamAccount({ from: address });
                let accountBalance = await token.balanceOf.call(address);
                accountBalance.should.be.bignumber.equal(amount);
            }

            let [lockedTokens,] = await safe.bundles.call(CORE_TEAM);
            lockedTokens.should.be.bignumber.equal(0);
        });
    });
});
