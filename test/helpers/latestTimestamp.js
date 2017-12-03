// Returns the time of the last mined block in seconds
export default function latestTimestamp() {
  return web3.eth.getBlock('latest').timestamp;
}
