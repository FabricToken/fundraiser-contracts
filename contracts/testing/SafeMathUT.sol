pragma solidity ^0.4.19;

import '../libraries/SafeMath.sol';

contract SafeMathUT {
    using SafeMath for uint;

    function plus(uint a, uint b) public pure returns (uint result) {
        return a.plus(b);
    }

    function minus(uint a, uint b) public pure returns (uint result) {
        return a.minus(b);
    }

    function mul(uint a, uint b) public pure returns (uint result) {
        return a.mul(b);
    }
    
    function div(uint a, uint b) public pure returns (uint result) {
        return a.div(b);
    }
}
