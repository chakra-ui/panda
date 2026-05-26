import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NativeBinding } from './index'

const require = createRequire(import.meta.url)
const currentDir = dirname(fileURLToPath(import.meta.url))

// `dist/` and `src/` both sit next to `compiler.node` in the package root.
const localBinding = join(currentDir, '..', 'compiler.node')

export function loadNativeBinding(): NativeBinding | undefined {
  if (existsSync(localBinding)) {
    return require(localBinding) as NativeBinding
  }

  try {
    return require('@pandacss/compiler-native') as NativeBinding
  } catch {
    return undefined
  }
}
