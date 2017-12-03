pragma solidity ^0.4.18;

import "../interfaces/ERC20TokenInterface.sol";
import "../traits/TokenSafe.sol";


/**
 * @title TokenSafeUT
 *
 * @dev TokenSafe contract Under Test that makes the contract testable by exposing the internal functions.
 */
contract TokenSafeUT is TokenSafe {
    /**
     * @dev The constructor. (required)
     */
    function TokenSafeUT(address _token) public
        TokenSafe(_token)
    {
    }

    // @dev Exposed internal functions
    function internalInitBundle(uint8 _type, uint _releaseDate) public {
        initBundle(_type, _releaseDate);
    }

    function internalAddLockedAccount(uint8 _type, address _account, uint _value) public {
        addLockedAccount(_type, _account, _value);
    }

    function internalReleaseAccount(uint8 _type, address _account) public {
        releaseAccount(_type, _account);
    }

    function internalBalanceOf(uint8 _type, address _account) public view returns (uint) {
        return bundles[_type].balances[_account];
    }
}
