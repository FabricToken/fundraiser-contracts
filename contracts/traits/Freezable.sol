pragma solidity ^0.4.19;


import "./HasOwner.sol";


/**
 * @title Freezable
 * @dev This trait allows to freeze the transactions in a Token
 */
contract Freezable is HasOwner {
  bool public frozen = false;

  /**
   * @dev Modifier makes methods callable only when the contract is not frozen.
   */
  modifier requireNotFrozen() {
    require(!frozen);
    _;
  }

  /**
   * @dev Allows the owner to "freeze" the contract.
   */
  function freeze() onlyOwner public {
    frozen = true;
  }

  /**
   * @dev Allows the owner to "unfreeze" the contract.
   */
  function unfreeze() onlyOwner public {
    frozen = false;
  }
}
