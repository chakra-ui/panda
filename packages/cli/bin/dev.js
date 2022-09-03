#!/usr/bin/env node

const { register } = require('esbuild-register/dist/node')

register()

const { main } = require('../src')

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
