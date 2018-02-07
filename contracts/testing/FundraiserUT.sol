pragma solidity ^0.4.19;

import "../FabricTokenFundraiser.sol";


/**
 * @title FundraiserUT
 *
 * @dev Fundraiser contract Under Test that makes the contract testable.
 */
contract FundraiserUT is FabricTokenFundraiser {
    // @dev individual limit in ether used in testing
    uint internal utIndividualLimitEther;

    function FundraiserUT (
        address _beneficiary,
        uint _conversionRate,
        uint _startDate,
        uint _endDate,
        uint _hardCap,
        uint _minimumContribution,
        uint _individualLimit) public
        FabricTokenFundraiser(_beneficiary)
    {
        conversionRate = _conversionRate;
        startDate = _startDate;
        endDate = _endDate;
        hardCap = _hardCap;
        minimumContribution = _minimumContribution;
        individualLimit = _individualLimit * _conversionRate;
        utIndividualLimitEther = _individualLimit;
    }

    // @dev Override the fundraiser function to set the conversion rate using
    function setConversionRate(uint _conversionRate) public onlyOwner {
        super.setConversionRate(_conversionRate);
        individualLimit = utIndividualLimitEther * _conversionRate;
    }

    // @dev Exposed internal variables
    function internalMinimumContribution() public view returns (uint) {
        return minimumContribution;
    }

    function internalIndividualLimit() public view returns (uint) {
        return individualLimit;
    }
}
