var FabricToken = artifacts.require("./FabricToken.sol");

module.exports = function(deployer) {
  deployer.deploy(FabricToken, 10000);
};
