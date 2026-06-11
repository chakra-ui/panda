import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { NativeBinding } from './index'

const require = createRequire(import.meta.url)

// napi-generated loader at the package root. Require via a variable so bundlers
// leave it external.
const bindingPath = fileURLToPath(new URL('../binding.cjs', import.meta.url))

/** Returns `undefined` on unsupported platforms so callers fall back to the no-op binding. */
export function loadNativeBinding(): NativeBinding | undefined {
  try {
    return require(bindingPath) as NativeBinding
  } catch {
    return undefined
  }
}
