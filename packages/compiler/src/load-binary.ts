import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { NativeBinding } from './types'

const require = createRequire(import.meta.url)

// napi-generated loader at the package root. Require via a variable so bundlers
// leave it external.
const bindingPath = fileURLToPath(new URL('../binding.cjs', import.meta.url))

/** Returns `undefined` when the generated loader is absent so callers can fall back in source-only installs. */
export function loadNativeBinding(): NativeBinding | undefined {
  if (!existsSync(bindingPath)) return undefined
  return require(bindingPath) as NativeBinding
}
