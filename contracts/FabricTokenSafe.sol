pragma solidity ^0.4.19;

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

        /// Core team.
        initBundle(CORE_TEAM,
            TOKENS_LOCKED_CORE_TEAM_RELEASE_DATE
        );

        // Accounts with tokens locked for the FT core team.
        addLockedAccount(CORE_TEAM, 0xB494096548aA049C066289A083204E923cBf4413, 4 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(CORE_TEAM, 0xE3506B01Bee377829ee3CffD8bae650e990c5d68, 4 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(CORE_TEAM, 0x9071085064aE42973E1D4232baB7437952Ce1fF1, 4 * (10**6) * DECIMALS_FACTOR);

        // Verify that the tokens add up to the constant in the configuration.
        assert(bundles[CORE_TEAM].lockedTokens == TOKENS_LOCKED_CORE_TEAM);

        /// Advisors.
        initBundle(ADVISORS,
            TOKENS_LOCKED_ADVISORS_RELEASE_DATE
        );

        // Accounts with FT tokens locked for advisors.
        addLockedAccount(ADVISORS, 0x9FCca1d644C85EE00eAD611E61a87f8CE535615e, 2 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(ADVISORS, 0x3eA2caac5A0A4a55f9e304AcD09b3CEe6cD4Bc39, 1 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(ADVISORS, 0xd5f791EC3ED79f79a401b12f7625E1a972382437, 1 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(ADVISORS, 0x2F54c78e0caa5240ed38fa7a5623Db47c2076F76, 1 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(ADVISORS, 0xb6EA6193058F3c8A4A413d176891d173D62E00bE, 1 * (10**6) * DECIMALS_FACTOR);
        addLockedAccount(ADVISORS, 0x8b3E184Cf5C3bFDaB1C4D0F30713D30314FcfF7c, 1 * (10**6) * DECIMALS_FACTOR);

        // Verify that the tokens add up to the constant in the configuration.
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
