#!/usr/bin/env node

import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const cliRoot = dirname(require.resolve('@pandacss/cli/package.json'))

await import(pathToFileURL(join(cliRoot, 'dist/cli-main.js')).href)
