#!/usr/bin/env node

// check if we're running in dev mode
const isDevMode = require('fs').existsSync(`./src`)
// or want to "force" running the compiled version with --compiled-build
const wantsCompiled = process.argv.indexOf('--compiled-build') >= 0

const argv = process.argv

if (wantsCompiled || !isDevMode) {
  // this runs from the compiled javascript source
  require(`./dist/cli-default.js`).run(argv)
} else {
  // this runs from the typescript source (for dev only)
  // hook into ts-node so we can run typescript on the fly
  const tsconfigRaw = require('./tsconfig.json')

  const { unregister } = require('esbuild-register/dist/node').register({ tsconfigRaw })
  const mod = require(`./src/cli-main`)
  mod.main(true)
  unregister()
}
