#!/usr/bin/env node

const { register } = require('esbuild-register/dist/node')

register({
  platform: 'node',
  define: {
    'import.meta.url': JSON.stringify(new URL('file:' + __filename).href),
  },
})

const { main } = require('../src')

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
