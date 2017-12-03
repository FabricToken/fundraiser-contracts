pragma solidity ^0.4.18;

import "./configs/FabricTokenFundraiserConfig.sol";
import "./libraries/SafeMath.sol";
import "./traits/TokenSafe.sol";


/**
 * @title FabricTokenSafe
 *
 * @dev The Fabric Token safe containing all details about locked tokens.
 */
contract FabricTokenSafe is TokenSafe, FabricTokenFundraiserConfig {
    // Bundle type constants
    uint8 constant CORE_TEAM = 0;
    uint8 constant ADVISORS = 1;

    /**
     * @dev The constructor.
     *
     * @param _token The address of the Fabric Token (fundraiser) contract.
     */
    function FabricTokenSafe(address _token) public
        TokenSafe(_token)
    {
        token = ERC20TokenInterface(_token);

        /// Core team
        initBundle(CORE_TEAM,
            TOKENS_LOCKED_CORE_TEAM_RELEASE_DATE
        );

        // Accounts with tokens locked for the FT core team.
        addLockedAccount(CORE_TEAM, 0x9E1Ef1eC212F5DFfB41d35d9E5c14054F26c6560, 4 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(CORE_TEAM, 0xce42bdB34189a93c55De250E011c68FaeE374Dd3, 4 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(CORE_TEAM, 0x97A3FC5Ee46852C1Cf92A97B7BaD42F2622267cC, 4 * (10**6) * DECIMALS_FACTOR);

        // Verify that the tokens add up to the constant in the configuration
        assert(bundles[CORE_TEAM].lockedTokens == TOKENS_LOCKED_CORE_TEAM);

        /// Advisors
        initBundle(ADVISORS,
            TOKENS_LOCKED_ADVISORS_RELEASE_DATE
        );

        // Accounts with FT tokens locked for advisors.
        addLockedAccount(ADVISORS, 0xB9dcBf8A52Edc0C8DD9983fCc1d97b1F5d975Ed7, 2 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(ADVISORS, 0x26064a2E2b568D9A6D01B93D039D1da9Cf2A58CD, 2 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(ADVISORS, 0xe84Da28128a48Dd5585d1aBB1ba67276FdD70776, 1 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(ADVISORS, 0xCc036143C68A7A9a41558Eae739B428eCDe5EF66, 1 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(ADVISORS, 0xE2b3204F29Ab45d5fd074Ff02aDE098FbC381D42, 1 * (10**6) * DECIMALS_FACTOR);

        // Verify that the tokens add up to the constant in the configuration
        assert(bundles[ADVISORS].lockedTokens == TOKENS_LOCKED_ADVISORS);
    }

    /**
     * @dev Returns the total locked tokens. This function is called by the fundraiser to determine number of tokens to create upon finalization.
     *
     * @return The current total number of locked Fabric Tokens.
     */
    function totalTokensLocked() public constant returns (uint) {
        return bundles[CORE_TEAM].lockedTokens.plus(bundles[ADVISORS].lockedTokens);
    }

    /**
     * @dev Allows core team account FT tokens to be released.
     */
    function releaseCoreTeamAccount() public {
        releaseAccount(CORE_TEAM, msg.sender);
    }

    /**
     * @dev Allows advisors account FT tokens to be released.
     */
    function releaseAdvisorsAccount() public {
        releaseAccount(ADVISORS, msg.sender);
    }
}
