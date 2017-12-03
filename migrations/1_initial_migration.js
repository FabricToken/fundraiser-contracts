var Migrations = artifacts.require("./testing/Migrations.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
