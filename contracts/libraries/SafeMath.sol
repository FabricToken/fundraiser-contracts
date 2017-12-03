pragma solidity ^0.4.18;


/**
 * @dev Library that helps prevent integer overflows and underflows,
 * inspired by https://github.com/OpenZeppelin/zeppelin-solidity
 */
library SafeMath {
    function plus(uint a, uint b) internal pure returns (uint) {
        uint c = a + b;
        assert(c >= a);

        return c;
    }

    function minus(uint a, uint b) internal pure returns (uint) {
        assert(b <= a);

        return a - b;
    }

    function mul(uint a, uint b) internal pure returns (uint) {
        uint c = a * b;
        assert(a == 0 || c / a == b);
        
        return c;
    }

    function div(uint a, uint b) internal pure returns (uint) {
        uint c = a / b;

        return c;
    }
}
