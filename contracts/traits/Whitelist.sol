pragma solidity ^0.4.19;

import "./HasOwner.sol";


contract Whitelist is HasOwner
{
    // Whitelist mapping
    mapping(address => bool) public whitelist;

    /**
     * @dev The constructor.
     */
    function Whitelist(address _owner) public
        HasOwner(_owner)
    {

    }

    /**
     * @dev Access control modifier that allows only whitelisted address to call the method.
     */
    modifier onlyWhitelisted {
        require(whitelist[msg.sender]);
        _;
    }

    /**
     * @dev Internal function that sets whitelist status in batch.
     *
     * @param _entries An array with the entries to be updated
     * @param _status The new status to apply
     */
    function setWhitelistEntries(address[] _entries, bool _status) internal {
        for (uint32 i = 0; i < _entries.length; ++i) {
            whitelist[_entries[i]] = _status;
        }
    }

    /**
     * @dev Public function that allows the owner to whitelist multiple entries
     *
     * @param _entries An array with the entries to be whitelisted
     */
    function whitelistAddresses(address[] _entries) public onlyOwner {
        setWhitelistEntries(_entries, true);
    }

    /**
     * @dev Public function that allows the owner to blacklist multiple entries
     *
     * @param _entries An array with the entries to be blacklist
     */
    function blacklistAddresses(address[] _entries) public onlyOwner {
        setWhitelistEntries(_entries, false);
    }
}
