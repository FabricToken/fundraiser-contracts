#!/bin/bash


BIN_DIR=$(dirname $0)
source $BIN_DIR/common.sh
source $BIN_DIR/ganache-config
cleanup

# Definitions
TESTRPC_PORT="8555"
TESTRPC_LOG="var/log/testrpc-sc.log"
TESTRPC_CMD="./node_modules/.bin/testrpc-sc --gasLimit 0xfffffffffff --port $TESTRPC_PORT ${GANACHE_ACCOUNTS[@]}"
SOLIDITY_COVERAGE_CMD="node_modules/.bin/solidity-coverage"

# Setup
$TESTRPC_CMD > $TESTRPC_LOG & echo $! >> var/run/testrpc.pid
sleep 1

# Replace the real addresses when testing address
if [ "$CI" == "true" ]; then
    $BIN_DIR/replace-with-test-addresses.sh
fi

# Testing
$SOLIDITY_COVERAGE_CMD "$@"

