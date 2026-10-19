#!/usr/bin/env node

import module from 'node:module'

// Before the CLI loads, so repeat runs reuse V8's compiled code.
module.enableCompileCache?.()

await import('./dist/cli-main.js')
