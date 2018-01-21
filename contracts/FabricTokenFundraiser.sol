pragma solidity ^0.4.18;

import './configs/FabricTokenFundraiserConfig.sol';
import './FabricToken.sol';
import './FabricTokenSafe.sol';

/**
 * @title FabricTokenFundraiser
 *
 * @dev The Fabric Token fundraiser contract.
 */
contract FabricTokenFundraiser is FabricToken, FabricTokenFundraiserConfig {
    // Indicates whether the fundraiser has ended or not.
    bool public finalized = false;

    // The address of the account which will receive the funds gathered by the fundraiser.
    address public beneficiary;

    // The number of FT participants will receive per 1 ETH.
    uint public conversionRate;

    // Fundraiser start date.
    uint public startDate;

    // Fundraiser end date.
    uint public endDate;

    // Fundraiser tokens hard cap.
    uint public hardCap;

    // The `FabricTokenSafe` contract.
    FabricTokenSafe public fabricTokenSafe;

    /**
     * @dev The event fires every time a new buyer enters the fundraiser.
     *
     * @param _address The address of the buyer.
     * @param _ethers The number of ethers sent.
     * @param _tokens The number of tokens received by the buyer.
     * @param _newTotalSupply The updated total number of tokens currently in circulation.
     * @param _conversionRate The conversion rate at which the tokens were bought.
     */
    event FundsReceived(address indexed _address, uint _ethers, uint _tokens, uint _newTotalSupply, uint _conversionRate);

    /**
     * @dev The event fires when the beneficiary of the fundraiser is changed.
     *
     * @param _beneficiary The address of the new beneficiary.
     */
    event BeneficiaryChange(address _beneficiary);

    /**
     * @dev The event fires when the number of FT per 1 ETH is changed.
     *
     * @param _conversionRate The new number of FT per 1 ETH.
     */
    event ConversionRateChange(uint _conversionRate);

    /**
     * @dev The event fires when the fundraiser is successfully finalized.
     *
     * @param _beneficiary The address of the beneficiary.
     * @param _ethers The number of ethers transfered to the beneficiary.
     * @param _totalSupply The total number of tokens in circulation.
     */
    event Finalized(address _beneficiary, uint _ethers, uint _totalSupply);

    /**
     * @dev The constructor.
     *
     * @param _beneficiary The address which will receive the funds gathered by the fundraiser.
     */
    function FabricTokenFundraiser(address _beneficiary) public
        FabricToken(0)
    {
        require(_beneficiary != 0);

        beneficiary = _beneficiary;
        conversionRate = CONVERSION_RATE;
        startDate = START_DATE;
        endDate = END_DATE;
        hardCap = TOKENS_HARD_CAP;

        fabricTokenSafe = new FabricTokenSafe(this);
    }

    /**
     * @dev Changes the beneficiary of the fundraiser.
     *
     * @param _beneficiary The address of the new beneficiary.
     */
    function setBeneficiary(address _beneficiary) public onlyOwner {
        require(_beneficiary != 0);

        beneficiary = _beneficiary;

        BeneficiaryChange(_beneficiary);
    }

    /**
     * @dev Sets converstion rate of 1 ETH to FT. Can only be changed before the fundraiser starts.
     *
     * @param _conversionRate The new number of Fabric Tokens per 1 ETH.
     */
    function setConversionRate(uint _conversionRate) public onlyOwner {
        require(now < startDate);
        require(_conversionRate > 0);

        conversionRate = _conversionRate;

        ConversionRateChange(_conversionRate);
    }

    /**
     * @dev The default function which will fire every time someone sends ethers to this contract's address.
     */
    function() public payable {
        buyTokens();
    }

    /**
     * @dev Creates new tokens based on the number of ethers sent and the conversion rate.
     */
    function buyTokens() public payable {
        require(!finalized);
        require(now >= startDate);
        require(now <= endDate);
        require(msg.value > 0);
        require(totalSupply <= hardCap);

	/// Set the address of the buyer to the msg.sender
        address buyer = msg.sender;

        /// Calculate the number of tokens the buyer will receive.
        uint tokens = msg.value.mul(conversionRate);

        balances[buyer] = balances[buyer].plus(tokens);
        totalSupply = totalSupply.plus(tokens);

        Transfer(0x0, buyer, tokens);

        FundsReceived(
            buyer, 
            msg.value, 
            tokens, 
            totalSupply, 
            conversionRate
        );
    }

    /**
     * @dev Finalize the fundraiser if `endDate` has passed or if `hardCap` is reached.
     */
    function finalize() public onlyOwner {
        require((totalSupply >= hardCap) || (now > endDate));
        require(!finalized);

        Finalized(beneficiary, this.balance, totalSupply);

        /// Send the total number of ETH gathered to the beneficiary.
        beneficiary.transfer(this.balance);

        /// Allocate locked tokens to the `FabricTokenSafe` contract.
        uint totalTokensLocked = fabricTokenSafe.totalTokensLocked(); 
        balances[address(fabricTokenSafe)] = balances[address(fabricTokenSafe)].plus(totalTokensLocked);
        totalSupply = totalSupply.plus(totalTokensLocked);

        // Transfer the funds for the bounty program.
        balances[owner] = balances[owner].plus(TOKENS_BOUNTY_PROGRAM);
        totalSupply = totalSupply.plus(TOKENS_BOUNTY_PROGRAM);

        /// Finalize the fundraiser. Keep in mind that this cannot be undone.
        finalized = true;
    }
}
