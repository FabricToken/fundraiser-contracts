#!/bin/bash

source $(dirname $0)/common.sh
source $(dirname $0)/ganache-config
cleanup

# Definitions
GANACHE_PORT="8535"
GANACHE_LOG="var/log/testrpc.log"
GANACHE_CMD="./node_modules/.bin/ganache-cli --port $GANACHE_PORT ${GANACHE_ACCOUNTS[@]}"
TRUFFLE_CMD="./node_modules/.bin/truffle"

# Setup
$GANACHE_CMD > $GANACHE_LOG & echo $! >> var/run/testrpc.pid
sleep 1

# Testing
$TRUFFLE_CMD test "$@"

