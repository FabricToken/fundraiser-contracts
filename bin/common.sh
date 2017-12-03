#!/bin/bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  shopt -s nullglob
  # terminate running processes
  for pidfile in var/run/*.pid; do
    PIDS="$(cat $pidfile)"
    rm $pidfile
    kill $PIDS
  done
  wait 2> /dev/null
}

