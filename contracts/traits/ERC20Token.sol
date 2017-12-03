pragma solidity ^0.4.18;

import '../libraries/SafeMath.sol';
import '../interfaces/ERC20TokenInterface.sol';


/**
 * @title ERC20Token
 *
 * @dev Implements the operations declared in the `ERC20TokenInterface`.
 */
contract ERC20Token is ERC20TokenInterface {
    using SafeMath for uint;

    // Token account balances.
    mapping (address => uint) balances;

    // Delegated number of tokens to transfer.
    mapping (address => mapping (address => uint)) allowed;

    /**
     * @dev Checks the balance of a certain address.
     *
     * @param _account The address which's balance will be checked.
     *
     * @return Returns the balance of the `_account` address.
     */
    function balanceOf(address _account) public constant returns (uint balance) {
        return balances[_account];
    }

    /**
     * @dev Transfers tokens from one address to another.
     *
     * @param _to The target address to which the `_value` number of tokens will be sent.
     * @param _value The number of tokens to send.
     *
     * @return Whether the transfer was successful or not.
     */
    function transfer(address _to, uint _value) public returns (bool success) {
        if (balances[msg.sender] < _value || _value == 0) {

            return false;
        }

        balances[msg.sender] -= _value;
        balances[_to] = balances[_to].plus(_value);

        Transfer(msg.sender, _to, _value);

        return true;
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
    function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
        if (balances[_from] < _value || allowed[_from][msg.sender] < _value || _value == 0) {
            return false;
        }

        balances[_to] = balances[_to].plus(_value);
        balances[_from] -= _value;
        allowed[_from][msg.sender] -= _value;

        Transfer(_from, _to, _value);

        return true;
    }

    /**
     * @dev Allows another contract to spend some tokens on your behalf.
     *
     * @param _spender The address of the account which will be approved for transfer of tokens.
     * @param _value The number of tokens to be approved for transfer.
     *
     * @return Whether the approval was successful or not.
     */
    function approve(address _spender, uint _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;

        Approval(msg.sender, _spender, _value);

        return true;
    }

    /**
     * @dev Shows the number of tokens approved by `_owner` that are allowed to be transferred by `_spender`.
     *
     * @param _owner The account which allowed the transfer.
     * @param _spender The account which will spend the tokens.
     *
     * @return The number of tokens to be transferred.
     */
    function allowance(address _owner, address _spender) public constant returns (uint remaining) {
        return allowed[_owner][_spender];
    }    
}
