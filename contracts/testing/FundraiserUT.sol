pragma solidity ^0.4.18;

import "../FabricTokenFundraiser.sol";


/**
 * @title FundraiserUT
 *
 * @dev Fundraiser contract Under Test that makes the contract testable.
 */
contract FundraiserUT is FabricTokenFundraiser {

    function FundraiserUT (
        address _beneficiary,
        uint _conversionRate,
        uint _startDate,
        uint _endDate,
        uint _hardCap) public
        FabricTokenFundraiser(_beneficiary)
    {
        conversionRate = _conversionRate;
        startDate = _startDate;
        endDate = _endDate;
        hardCap = _hardCap;
    }
    
}
