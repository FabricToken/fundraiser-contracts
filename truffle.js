require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8535,
      network_id: "*", // Match any network id
      gasPrice: 40000000000,
    },
    coverage: {
      host: "localhost",
      network_id: "*", 
      port: 8555,         
      gas: 0xfffffffffff, 
      gasPrice: 0x01      
    }
  }
};
