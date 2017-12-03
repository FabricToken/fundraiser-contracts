pragma solidity ^0.4.18;

import './FabricTokenConfig.sol';


/**
 * @title FabricTokenFundraiserConfig
 *
 * @dev The static configuration for the Fabric Token fundraiser.
 */
contract FabricTokenFundraiserConfig is FabricTokenConfig {
    // The number of FT per 1 ETH.
    uint constant CONVERSION_RATE = 2679;

    // The hard cap of the fundraiser.
    uint constant TOKENS_HARD_CAP = 80 * (10**6) * DECIMALS_FACTOR;

    // The start date of the fundraiser: Thursday, 12/21/2017 10:00:00 UTC.
    uint constant START_DATE = 1513850400;

    // The end date of the fundraiser: Saturday, 02/04/2018 10:00:00 UTC (45 days after `START_DATE`).
    uint constant END_DATE = 1517738400;
    
    // Total number of tokens locked for the FT core team.
    uint constant TOKENS_LOCKED_CORE_TEAM = 12 * (10**6) * DECIMALS_FACTOR;

    // Total number of tokens locked for FT advisors.
    uint constant TOKENS_LOCKED_ADVISORS = 7 * (10**6) * DECIMALS_FACTOR;

    // The release date for tokens locked for the FT core team.
    uint constant TOKENS_LOCKED_CORE_TEAM_RELEASE_DATE = START_DATE + 1 years;

    // The release date for tokens locked for FT advisors.
    uint constant TOKENS_LOCKED_ADVISORS_RELEASE_DATE = START_DATE + 180 days;

    // Total number of tokens locked for bounty program.
    uint constant TOKENS_BOUNTY_PROGRAM = 1 * (10**6) * DECIMALS_FACTOR;
}