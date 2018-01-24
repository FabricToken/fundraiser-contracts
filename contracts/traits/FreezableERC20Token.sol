pragma solidity ^0.4.18;

import "./ERC20Token.sol";
import "./Freezable.sol";


/**
 * @title FreezableERC20Token
 *
 * @dev Extends ERC20Token and adds ability to freeze all transfers of tokens.
 */
contract FreezableERC20Token is ERC20Token, Freezable {
    /**
     * @dev Overrides the original ERC20Token implementation by adding whenNotFrozen modifier.
     *
     * @param _to The target address to which the `_value` number of tokens will be sent.
     * @param _value The number of tokens to send.
     *
     * @return Whether the transfer was successful or not.
     */
    function transfer(address _to, uint _value) public requireNotFrozen returns (bool success) {
        return super.transfer(_to, _value);
    }

    /**
     * @dev Send `_value` tokens to `_to` from `_from` if `_from` has approved the process.
     *
     * @param _from The address of the sender.
     * @param _to The address of the recipient.
     * @param _value The number of tokens to be transferred.
     *
     * @return Whether the transfer was successful or not.
     */
    function transferFrom(address _from, address _to, uint _value) public requireNotFrozen returns (bool success) {
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * @dev Allows another contract to spend some tokens on your behalf.
     *
     * @param _spender The address of the account which will be approved for transfer of tokens.
     * @param _value The number of tokens to be approved for transfer.
     *
     * @return Whether the approval was successful or not.
     */
    function approve(address _spender, uint _value) public requireNotFrozen returns (bool success) {
        return super.approve(_spender, _value);
    }

}
