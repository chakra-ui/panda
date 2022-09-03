#!/usr/bin/env node

const { register } = require('esbuild-register/dist/node')

register({ platform: 'node' })

const { main } = require('../src')

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
