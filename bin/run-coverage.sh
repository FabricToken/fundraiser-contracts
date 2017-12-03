#!/bin/bash

source $(dirname $0)/common.sh
source $(dirname $0)/ganache-config
cleanup

# Definitions
TESTRPC_PORT="8555"
TESTRPC_LOG="var/log/testrpc-sc.log"
TESTRPC_CMD="./node_modules/.bin/testrpc-sc --gasLimit 0xfffffffffff --port $TESTRPC_PORT ${GANACHE_ACCOUNTS[@]}"
SOLIDITY_COVERAGE_CMD="node_modules/.bin/solidity-coverage"

# Setup
$TESTRPC_CMD > $TESTRPC_LOG & echo $! >> var/run/testrpc.pid
sleep 1

# Testing
$SOLIDITY_COVERAGE_CMD "$@"

