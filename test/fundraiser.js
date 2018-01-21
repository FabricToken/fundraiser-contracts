'use strict';

import expectThrow from './helpers/expectThrow';
import advanceBlock from './helpers/advanceBlock';
import advanceTime from './helpers/advanceTime';
import latestTimestamp from './helpers/latestTimestamp';
const Fundraiser = artifacts.require("./FabricTokenFundraiser.sol");
const FundraiserUT = artifacts.require("./testing/FundraiserUT.sol");

const BigNumber = web3.BigNumber

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should()

contract('Fundraiser', function (accounts) {
    const initialConversionRate = 3000;
    const hardCap = 10 ** 5;
    let token;
    let now;
    let oneDayBefore, oneDayAfter, twoDaysAfter;

    function updateTimestamps() {
        now = latestTimestamp();
        oneDayBefore = now - 24 * 3600;
        oneDayAfter = now + 24 * 3600;
        twoDaysAfter = now + 24 * 3600;
    }

    before(async function () {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock()
        updateTimestamps();
    })

    describe('contract construction', function () {
        it('should throw an error if no beneficiary is set', async function () {
            await expectThrow(Fundraiser.new(0));
        });

        it('should throw an error if no beneficiary is set', async function () {
            await expectThrow(FundraiserUT.new(0, initialConversionRate, oneDayBefore, oneDayAfter, hardCap));
        });
    });

    describe('handling the beneficiary', function () {
        beforeEach(async function () {
            token = await Fundraiser.new(accounts[0]);
        });

        it('should return the proper beneficiary when created', async function () {
            let beneficiary = await token.beneficiary.call();
            assert.equal(beneficiary, accounts[0], 'should be the one set druring creation');
        });

        it('should not allow to set zero address beneficiary', async function () {
            await expectThrow(token.setBeneficiary(0));
        });

        it('should allow to change beneficiary', async function () {
            await token.setBeneficiary(accounts[1]);
            let beneficiary = await token.beneficiary.call();
            assert.equal(beneficiary, accounts[1], 'should be changed');
        });

        it('should not allow anyone other than the owner to change beneficiary', async function () {
            await expectThrow(token.setBeneficiary(accounts[1], { from: accounts[1] }));
        });
    });

    describe('before the fundraiser begin', function () {
        beforeEach(async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayAfter, twoDaysAfter, hardCap);
        });

        it('should allow to change conversion rate by the owner', async function () {
            let result = await token.setConversionRate(1000);
            assert.equal(result.logs.length, 1);
            assert.equal(result.logs[0].event, 'ConversionRateChange');
            assert.equal(result.logs[0].args._conversionRate, 1000);
            let conversionRate = await token.conversionRate.call();
            assert.equal(conversionRate, 1000)
        });

        it('should allow to whitelist entries', async function () {
            await token.whitelistAddresses([accounts[1], accounts[2]]);
            assert.equal(await token.whitelist.call(accounts[1]), true);
            assert.equal(await token.whitelist.call(accounts[2]), true);
        });

        it('should not allow to change conversion rate to zero', async function () {
            await expectThrow(token.setConversionRate(0));
        });

        it('should not allow to change conversion rate by someone other than the owner', async function () {
            await expectThrow(token.setConversionRate(1000, { from: accounts[1] }));
        });

        it('should not allow anyone to create tokens by sending ether to contract', async function () {
            await expectThrow(token.send(10));
        });

        it('should not allow anyone to create tokens by sending ether to #buyTokens()', async function () {
            await expectThrow(token.buyTokens({ value: 10 }));
        });

        it('should not allow to finalize the fundraiser', async function () {
            await expectThrow(token.finalize());
        });
    });

    describe('during the fundraiser', function () {
        beforeEach(async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, oneDayAfter, hardCap);
            await token.whitelistAddresses([accounts[0], accounts[1], accounts[2]]);
        });

        it('should not allow owner to change conversion rate', async function () {
            await expectThrow(token.setConversionRate(1000));
        });

        it('should not allow anyone else to change conversion rate', async function () {
            await expectThrow(token.setConversionRate(1000, { from: accounts[1] }));
        });

        it('should not allow to finalize the fundraiser', async function () {
            await expectThrow(token.finalize());
        });

        it('should allow to finalize the fundraiser if the hardcap is reached', async function () {
            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            let result = await token.send(ethersHardCap);
            await token.finalize();
            let isFinalized = await token.finalized.call();
            assert.strictEqual(isFinalized, true);
        });

        it('should transfer the correct amount of ether to the beneficiary', async function () {
            token = await FundraiserUT.new(accounts[9], initialConversionRate, oneDayBefore, oneDayAfter, hardCap);
            await token.whitelistAddresses([accounts[1]]);

            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            let result = await token.sendTransaction({ value: ethersHardCap, from: accounts[1] });
            let initialBeneficiaryBalance = web3.eth.getBalance(accounts[9]);
            await token.finalize(); // Finalize based on hard cap
            let beneficiaryBalance = web3.eth.getBalance(accounts[9]);
            beneficiaryBalance.minus(initialBeneficiaryBalance).should.be.bignumber.equal(ethersHardCap);
        });

        it('should transfer the correct amount of tokens for the bounty program to the owner', async function () {
            token = await FundraiserUT.new(accounts[9], initialConversionRate, oneDayBefore, oneDayAfter, hardCap);
            await token.whitelistAddresses([accounts[1]]);

            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            let result = await token.sendTransaction({ value: ethersHardCap, from: accounts[1] });
            let initialBeneficiaryBalance = web3.eth.getBalance(accounts[9]);
            await token.finalize(); // Finalize based on hard cap
            let ownerTokensBalance = await token.balanceOf.call(accounts[0]);
            let expectedBountyTokens = new BigNumber("10").pow(6 + 18);
            ownerTokensBalance.should.be.bignumber.equal(expectedBountyTokens);
        });

        it('should not allow any transfers after the hardcap is reached', async function () {
            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            let result = await token.send(ethersHardCap);
            await expectThrow(token.send(1));
            await expectThrow(token.sendTransaction({ value: 1, from: accounts[1] }));
            await expectThrow(token.buyTokens({ value: 1, from: accounts[0] }));
            await expectThrow(token.buyTokens({ value: 1, from: accounts[1] }));
        });

        it('should not allow to finalize the fundraiser by a non-owner, even if the hardcap is reached', async function () {
            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            let result = await token.send(ethersHardCap);
            await expectThrow(token.finalize({ from: accounts[1] }));
        });
    });

    describe('funds receive during the fundraiser', function () {
        beforeEach(async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, oneDayAfter, hardCap);
            await token.whitelistAddresses([accounts[0], accounts[1], accounts[2]]);
        });

        async function assert_funds(acc, value, logs) {
            let balance = await token.balanceOf.call(acc);
            assert.equal(balance, initialConversionRate * value);
            let totalSupply = await token.totalSupply.call();
            assert.equal(totalSupply, initialConversionRate * value);
            assert.equal(logs.length, 2);
            let fundsReceivedEvent = logs.find(e => e.event === 'FundsReceived');
            assert.isOk(fundsReceivedEvent);
            fundsReceivedEvent.args._ethers.should.be.bignumber.equal(value);
            fundsReceivedEvent.args._tokens.should.be.bignumber.equal(value * initialConversionRate);
            fundsReceivedEvent.args._newTotalSupply.should.be.bignumber.equal(value * initialConversionRate);
            fundsReceivedEvent.args._conversionRate.should.be.bignumber.equal(initialConversionRate);
            let transferEvent = logs.find(e => e.event === 'Transfer');
            assert.isOk(transferEvent);
            transferEvent.args._value.should.be.bignumber.equal(value * initialConversionRate);
        }

        it('should allow to create tokens by sending ether to contract', async function () {
            let result = await token.send(10);
            let balance = await token.balanceOf.call(accounts[0]);
            await assert_funds(accounts[0], 10, result.logs);
        });

        it('should allow to create tokens by sending ether to #buyTokens()', async function () {
            let result = await token.buyTokens({ value: 10 });
            let balance = await token.balanceOf.call(accounts[0]);
            await assert_funds(accounts[0], 10, result.logs);
        });

        it('should allow anyone to buy tokens as anyone else using #buyTokens()', async function () {
            let result = await token.buyTokens({ value: 2, from: accounts[2] });
            let balance = await token.balanceOf.call(accounts[2]);
            await assert_funds(accounts[2], 2, result.logs);
        });

        it('should allow anyone to buy tokens by sending ether to contract', async function () {
            let buyer = accounts[1]; // different than the owner
            let result = await token.sendTransaction({ value: 3, from: buyer });
            await assert_funds(buyer, 3, result.logs);
        });

        it('should not allow zero ether transactions', async function () {
            await expectThrow(token.send(0));
            await expectThrow(token.sendTransaction({ value: 0, from: accounts[1] }));
            await expectThrow(token.buyTokens({ value: 0, from: accounts[0] }));
        });
    });

    describe('second before and after the end date fundraiser', function () {
        beforeEach(async function () {
            updateTimestamps();
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, now + 5, hardCap);
            await token.whitelistAddresses([accounts[0]]);
            updateTimestamps()
        });

        it('should only allow the owner to finalize the fundraiser', async function () {
            let lowerThenHardCapEther = Math.floor(hardCap / initialConversionRate) - 1;
            await token.send(lowerThenHardCapEther);
            advanceTime(20); // now + 20
            await expectThrow(token.finalize({ from: accounts[1] }));
            assert.isNotOk(await token.finalized.call());
            await token.finalize({ from: accounts[0] });
            assert.isOk(await token.finalized.call());
        });

        it('should allow to finalize fundraiser after end date, even if the hard cap is not reached', async function () {
            let lowerThenHardCapEther = Math.floor(hardCap / initialConversionRate) - 1;
            await token.send(lowerThenHardCapEther);
            advanceTime(20); // now + 20
            await token.finalize();
            assert.isOk(await token.finalized.call());
        });
    });
});
