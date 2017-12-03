pragma solidity ^0.4.18;


/**
 * @title FabricTokenConfig
 *
 * @dev The static configuration for the Fabric Token.
 */
contract FabricTokenConfig {
    // The name of the token.
    string constant NAME = "Fabric Token";

    // The symbol of the token.
    string constant SYMBOL = "FT";

    // The number of decimals for the token.
    uint8 constant DECIMALS = 18;  // Same as ethers.

    // Decimal factor for multiplication purposes.
    uint constant DECIMALS_FACTOR = 10 ** uint(DECIMALS);
}
