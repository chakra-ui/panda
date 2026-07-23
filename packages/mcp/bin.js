#!/usr/bin/env node

const { main } = require('./dist/cli.js')

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
