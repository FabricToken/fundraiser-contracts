'use strict';

import expectThrow from './helpers/expectThrow';
import advanceBlock from './helpers/advanceBlock';
import advanceTime from './helpers/advanceTime';
import latestTimestamp from './helpers/latestTimestamp';

const Fundraiser = artifacts.require("./FabricTokenFundraiser.sol");
const FundraiserUT = artifacts.require("./testing/FundraiserUT.sol");
const FabricTokenSafe = artifacts.require("./FabricTokenSafe.sol");

const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Fundraiser', function (accounts) {
    const decimalsFactor = new BigNumber(10).pow(18);
    const millionFactor = new BigNumber(10).pow(6);
    const initialConversionRate = 3000;
    const hardCap = new BigNumber(web3.toWei(1, 'kwei')).mul(initialConversionRate);
    const minimumContribution = new BigNumber(web3.toWei(1, 'wei'));
    const individualLimit = new BigNumber(web3.toWei(100, 'ether'));
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
        await advanceBlock();
        updateTimestamps();
    });

    describe('contract construction', function () {
        it('should throw an error on invalid arguments', async function () {
            await expectThrow(Fundraiser.new(0));
        });

        it('should throw an error if no beneficiary is set', async function () {
            await expectThrow(FundraiserUT.new(0, initialConversionRate, oneDayBefore, oneDayAfter, hardCap, minimumContribution, individualLimit));
        });

        it('should have all parameters set as expected', async function () {
            token = await FundraiserUT.new(accounts[1], initialConversionRate, oneDayBefore, oneDayAfter, hardCap, minimumContribution, individualLimit);
            let beneficiary = await token.beneficiary.call();
            beneficiary.should.be.equal(accounts[1]);
            let conversionRate = await token.conversionRate.call();
            conversionRate.should.be.bignumber.equal(initialConversionRate);
            let startDate = await token.startDate.call();
            startDate.should.be.bignumber.equal(oneDayBefore);
            let endDate = await token.endDate.call();
            endDate.should.be.bignumber.equal(oneDayAfter);
            let tokenHardCap = await token.hardCap.call();
            tokenHardCap.should.be.bignumber.equal(hardCap);
            let internalMinimumContribution = await token.internalMinimumContribution.call();
            internalMinimumContribution.should.be.bignumber.equal(minimumContribution);
            let internalIndividualLimit = await token.internalIndividualLimit.call();
            internalIndividualLimit.should.be.bignumber.equal(individualLimit.mul(initialConversionRate));
        });
    });

    describe('handling the beneficiary', function () {
        beforeEach(async function () {
            token = await Fundraiser.new(accounts[0]);
        });

        it('should return the proper beneficiary when created', async function () {
            let beneficiary = await token.beneficiary.call();
            assert.equal(beneficiary, accounts[0], 'should be the one set during creation');
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
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayAfter, twoDaysAfter, hardCap, minimumContribution, individualLimit);
        });

        it('should allow to change conversion rate by the owner', async function () {
            let result = await token.setConversionRate(1000);
            assert.equal(result.logs.length, 1);
            assert.equal(result.logs[0].event, 'ConversionRateChange');
            assert.equal(result.logs[0].args._conversionRate, 1000);
            let conversionRate = await token.conversionRate.call();
            conversionRate.should.be.bignumber.equal(1000);
            let internalIndividualLimit = await token.internalIndividualLimit.call();
            internalIndividualLimit.should.be.bignumber.equal(individualLimit.mul(1000));
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

        it('should not allow strategic partners to claim their tokens before the fundraiser begins', async function () {
            await expectThrow(token.claimPartnerTokens());
        });
    });

    describe('during the fundraiser', function () {
        beforeEach(async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, oneDayAfter, hardCap, minimumContribution, individualLimit);
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
            token = await FundraiserUT.new(accounts[9], initialConversionRate, oneDayBefore, oneDayAfter, hardCap, minimumContribution, individualLimit);
            await token.whitelistAddresses([accounts[1]]);

            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            let result = await token.sendTransaction({ value: ethersHardCap, from: accounts[1] });
            let initialBeneficiaryBalance = web3.eth.getBalance(accounts[9]);
            await token.finalize(); // Finalize based on hard cap
            let beneficiaryBalance = web3.eth.getBalance(accounts[9]);
            beneficiaryBalance.minus(initialBeneficiaryBalance).should.be.bignumber.equal(ethersHardCap);
        });

        it('should transfer the correct amount of tokens for the bounty program to the owner', async function () {
            token = await FundraiserUT.new(accounts[9], initialConversionRate, oneDayBefore, oneDayAfter, hardCap, minimumContribution, individualLimit);
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
            let ethersHardCap = Math.ceil(hardCap / initialConversionRate) + 1;
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

        it('should not allow to transfer tokens, since it is frozen', async function () {
            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            await token.send(ethersHardCap);
            await expectThrow(token.transfer(accounts[1], 1));
        });

        it('should not allow to transfer tokens, since it is frozen', async function () {
            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            await token.send(ethersHardCap);
            await token.finalize();
            assert.isOk(await token.finalized.call());
            let result = await token.transfer(accounts[1], 1);
            assert.isOk(result);
        });

        it('should allow strategic partners to claim their tokens', async function () {
            let initialTotalSupply = await token.totalSupply.call();

            await token.claimPartnerTokens();

            let balancePartner1 = await token.balanceOf.call("0x87c490ad2bE5447A61bdED4fac06fC3a2A7542b8");
            balancePartner1.should.be.bignumber.equal(new BigNumber("1.25").mul(millionFactor).mul(decimalsFactor));

            let balancePartner2 = await token.balanceOf.call("0xeAD3fC31668c1Ea45efEc3De609DEC1ded72cF79");
            balancePartner2.should.be.bignumber.equal(new BigNumber("7.5").mul(millionFactor).mul(decimalsFactor));

            let newTotalSupply = await token.totalSupply.call();
            newTotalSupply.should.be.bignumber.equal(initialTotalSupply.plus(new BigNumber("8.75").mul(millionFactor).mul(decimalsFactor)));
        });

        it('should not allow strategic partners to claim their tokens twice', async function () {
            await token.claimPartnerTokens();
            await expectThrow(token.claimPartnerTokens());
        });
    });

    describe('funds receive during the fundraiser', function () {
        beforeEach(async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, oneDayAfter, hardCap, minimumContribution, individualLimit);
            await token.whitelistAddresses([accounts[0], accounts[1], accounts[2]]);
        });

        let assertFunds = async function(acc, value, logs) {
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
        };

        it('should allow to create tokens by sending ether to contract', async function () {
            let result = await token.send(10);
            let balance = await token.balanceOf.call(accounts[0]);
            await assertFunds(accounts[0], 10, result.logs);
        });

        it('should allow to create tokens by sending ether to #buyTokens()', async function () {
            let result = await token.buyTokens({ value: 10 });
            let balance = await token.balanceOf.call(accounts[0]);
            await assertFunds(accounts[0], 10, result.logs);
        });

        it('should allow anyone to buy tokens as anyone else using #buyTokens()', async function () {
            let result = await token.buyTokens({ value: 2, from: accounts[2] });
            let balance = await token.balanceOf.call(accounts[2]);
            await assertFunds(accounts[2], 2, result.logs);
        });

        it('should allow anyone to buy tokens by sending ether to contract', async function () {
            let buyer = accounts[1]; // different than the owner
            let result = await token.sendTransaction({ value: 3, from: buyer });
            await assertFunds(buyer, 3, result.logs);
        });

        it('should not allow zero ether transactions', async function () {
            await expectThrow(token.send(0));
            await expectThrow(token.sendTransaction({ value: 0, from: accounts[1] }));
            await expectThrow(token.buyTokens({ value: 0, from: accounts[0] }));
        });

        it('should allow to buy tokens using limited gas price', async function () {
            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            await token.sendTransaction({
                from: accounts[0],
                value: ethersHardCap,
                gasPrice: new BigNumber(10).pow(9).mul(40) // 40 gwei
            });
        });

        it('should not allow to buy tokens using higher gas price', async function () {
            let ethersHardCap = Math.ceil(hardCap / initialConversionRate);
            await expectThrow(token.sendTransaction({
                from: accounts[0],
                value: ethersHardCap,
                gasPrice: new BigNumber(10).pow(9).mul(60) // 60 gwei
            }));
        });

        it('should allow to buy tokens with higher or equal than the minimal contribution', async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, oneDayAfter, hardCap, web3.toWei("0.1", "kwei"), individualLimit);
            await token.whitelistAddresses([accounts[0]]);
            await expectThrow(token.send(web3.toWei("0.01", "kwei")));
            await token.send(web3.toWei("0.1", "kwei"));
            await token.send(web3.toWei("0.2", "kwei"));
        });

        it('should not allow to buy tokens with lower than the minimal contribution', async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, oneDayAfter, hardCap, web3.toWei("0.1", "ether"), individualLimit);
            await token.whitelistAddresses([accounts[0]]);
            await expectThrow(token.send(web3.toWei("0.01", "ether")));
        });

        it('should allow to buy tokens up to a limit', async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, oneDayAfter, hardCap, web3.toWei("1", "wei"), web3.toWei("1", "kwei"));
            await token.whitelistAddresses([accounts[0]]);
            await token.send(web3.toWei("0.5", "kwei"));
            await token.send(web3.toWei("0.5", "kwei"));
            await expectThrow(token.send(web3.toWei("1", "wei")));
        });

        it('should allow to buy more tokens than the limit', async function () {
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, oneDayAfter, hardCap, web3.toWei("1", "wei"), web3.toWei("1", "kwei"));
            await token.whitelistAddresses([accounts[0]]);
            await expectThrow(token.send(web3.toWei("1001", "wei")));
        });
    });

    describe('second before and after the end date fundraiser', function () {
        beforeEach(async function () {
            updateTimestamps();
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, now + 5, hardCap, minimumContribution, individualLimit);
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

    // KLUDGE: This test is placed after the fundraiser tests since it manipulates time and experience shows that
    //         truffle cannot guarantee consistent order of execution of the tests suites based on test filename.
    describe('integration testing the FabricTokenSafe using FundraiserUT', function () {
        let safe;
        const CORE_TEAM = 0,
            ADVISORS = 1;
        const initialConversionRate = 3000;
        const hardCap = 10 ** 5;
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
            updateTimestamps();
            token = await FundraiserUT.new(accounts[0], initialConversionRate, oneDayBefore, now, hardCap, minimumContribution, individualLimit);
            safe = FabricTokenSafe.at(await token.fabricTokenSafe.call());
            // Finalize fundraiser
            await token.finalize();
            assert.isTrue(await token.finalized.call());
        });

        it('should allow the release of advisors\' locked tokens, but not before the release date', async function () {
            let [, releaseDate] = await safe.bundles.call(ADVISORS);
            if (now > releaseDate.toNumber()) {
                assert.fail(0, 0, 'The release date for the advisors has already passed');
            }
            // Before the release date
            for (let [address,] of advisorsAccounts) {
                await expectThrow(safe.releaseAdvisorsAccount({ from: address }));
            }

            // Move after the release date
            advanceTime(releaseDate - now + 100);

            // Release all advisors' locked accounts
            for (let [address, amount] of advisorsAccounts) {
                await safe.releaseAdvisorsAccount({ from: address });
                let accountBalance = await token.balanceOf.call(address);
                accountBalance.should.be.bignumber.equal(amount);
            }

            let [lockedTokens,] = await safe.bundles.call(ADVISORS);
            lockedTokens.should.be.bignumber.equal(0);
        });

        it('should allow the release of core team locked tokens, but not before the release date', async function () {
            let [, releaseDate] = await safe.bundles.call(CORE_TEAM);
            if (now > releaseDate.toNumber()) {
                assert.fail(0, 0, 'The release date for the core team has already passed');
            }
            // Before the release date
            for (let [address,] of coreTeamAccounts) {
                await expectThrow(safe.releaseCoreTeamAccount({ from: address }));
            }

            // Move after the release date
            advanceTime(releaseDate - now + 100);

            // Release all core team locked accounts
            for (let [address, amount] of coreTeamAccounts) {
                await safe.releaseCoreTeamAccount({ from: address });
                let accountBalance = await token.balanceOf.call(address);
                accountBalance.should.be.bignumber.equal(amount);
            }

            let [lockedTokens,] = await safe.bundles.call(CORE_TEAM);
            lockedTokens.should.be.bignumber.equal(0);
        });
    });
});
