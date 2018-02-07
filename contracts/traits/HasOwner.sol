pragma solidity ^0.4.19;


/**
 * @title HasOwner
 *
 * @dev Allows for exclusive access to certain functionality.
 */
contract HasOwner {
    // Current owner.
    address public owner;

    // Conditionally the new owner.
    address public newOwner;

    /**
     * @dev The constructor.
     *
     * @param _owner The address of the owner.
     */
    function HasOwner(address _owner) internal {
        owner = _owner;
    }

    /** 
     * @dev Access control modifier that allows only the current owner to call the function.
     */
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    /**
     * @dev The event is fired when the current owner is changed.
     *
     * @param _oldOwner The address of the previous owner.
     * @param _newOwner The address of the new owner.
     */
    event OwnershipTransfer(address indexed _oldOwner, address indexed _newOwner);

    /**
     * @dev Transfering the ownership is a two-step process, as we prepare
     * for the transfer by setting `newOwner` and requiring `newOwner` to accept
     * the transfer. This prevents accidental lock-out if something goes wrong
     * when passing the `newOwner` address.
     *
     * @param _newOwner The address of the proposed new owner.
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }
 
    /**
     * @dev The `newOwner` finishes the ownership transfer process by accepting the
     * ownership.
     */
    function acceptOwnership() public {
        require(msg.sender == newOwner);

        OwnershipTransfer(owner, newOwner);

        owner = newOwner;
    }
}
