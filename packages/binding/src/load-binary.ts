import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NativeBinding } from './index'

const require = createRequire(import.meta.url)
const currentDir = dirname(fileURLToPath(import.meta.url))

const candidates = [
  join(currentDir, '..', 'binding_napi.node'),
  join(currentDir, '..', '..', 'binding_napi.node'),
  join(currentDir, '..', '..', 'binding.node'),
]

export function loadNativeBinding(): NativeBinding | undefined {
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue
    return require(candidate) as NativeBinding
  }

  try {
    return require('@pandacss/binding-native') as NativeBinding
  } catch {
    return undefined
  }
}
