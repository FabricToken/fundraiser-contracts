module.exports = {
    norpc: true,
    testCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle test --network coverage',
    skipFiles: ['testing/Migrations.sol', 'testing/Logging.sol', 'testing/ThrowProxy.sol']
}