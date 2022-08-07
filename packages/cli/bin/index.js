#!/usr/bin/env node

const { main } = require('../dist/index.js')

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
