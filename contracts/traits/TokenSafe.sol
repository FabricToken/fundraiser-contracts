pragma solidity ^0.4.18;

import "../libraries/SafeMath.sol";
import "../interfaces/ERC20TokenInterface.sol";


/**
 * @title TokenSafe
 *
 * @dev A multi-bundle token safe contract that contains locked tokens released after a date for the specific bundle type.
 */
contract TokenSafe {
    using SafeMath for uint;

    struct AccountsBundle {
        // The total number of tokens locked.
        uint lockedTokens;
        // The release date for the locked tokens
        // Note: Unix timestamp fits uint32, however block.timestamp is uint
        uint releaseDate;
        // The balances for the FT locked token accounts.
        mapping (address => uint) balances;
    }

    // The account bundles of locked tokens grouped by release date
    mapping (uint8 => AccountsBundle) public bundles;

    // The `ERC20TokenInterface` contract.
    ERC20TokenInterface token;

    /**
     * @dev The constructor.
     *
     * @param _token The address of the Fabric Token (fundraiser) contract.
     */
    function TokenSafe(address _token) public {
        token = ERC20TokenInterface(_token);
    }

    /**
     * @dev The function initializes the bundle of accounts with a release date.
     *
     * @param _type Bundle type.
     * @param _releaseDate Unix timestamp of the time after which the tokens can be released
     */
    function initBundle(uint8 _type, uint _releaseDate) internal {
        bundles[_type].releaseDate = _releaseDate;
    }

    /**
     * @dev Add new account with locked token balance to the specified bundle type.
     *
     * @param _type Bundle type.
     * @param _account The address of the account to be added.
     * @param _balance The number of tokens to be locked.
     */
    function addLockedAccount(uint8 _type, address _account, uint _balance) internal {
        var bundle = bundles[_type];
        bundle.balances[_account] = bundle.balances[_account].plus(_balance);
        bundle.lockedTokens = bundle.lockedTokens.plus(_balance);
    }

    /**
     * @dev Allows an account to be released if it meets the time constraints.
     *
     * @param _type Bundle type.
     * @param _account The address of the account to be released.
     */
    function releaseAccount(uint8 _type, address _account) internal {
        var bundle = bundles[_type];
        require(now >= bundle.releaseDate);
        uint tokens = bundle.balances[_account];
        require(tokens > 0);
        bundle.balances[msg.sender] = 0;
        bundle.lockedTokens = bundle.lockedTokens.minus(tokens);
        if (!token.transfer(_account, tokens)) {
            revert();
        }
    }
}
