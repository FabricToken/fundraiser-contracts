export default function advanceTime(time) {
    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [time], id: 0});
}
