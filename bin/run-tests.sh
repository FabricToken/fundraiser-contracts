#!/bin/bash

BIN_DIR=$(dirname $0)
source $BIN_DIR/common.sh
source $BIN_DIR/ganache-config
cleanup

# Definitions
GANACHE_PORT="8535"
GANACHE_LOG="var/log/testrpc.log"
GANACHE_CMD="./node_modules/.bin/ganache-cli --port $GANACHE_PORT ${GANACHE_ACCOUNTS[@]}"
TRUFFLE_CMD="./node_modules/.bin/truffle"

# Setup
$GANACHE_CMD > $GANACHE_LOG & echo $! >> var/run/testrpc.pid
sleep 1

# Replace the real addresses when testing address
if [ "$CI" == "true" ]; then
    $BIN_DIR/replace-with-test-addresses.sh
fi

# Testing
$TRUFFLE_CMD test "$@"

