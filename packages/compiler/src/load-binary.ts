import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NativeBinding } from './types'

// napi-generated loader at the package root. Require via a variable so bundlers
// leave it external.
const bindingUrl = new URL('../binding.cjs', import.meta.url)

/** Returns `undefined` when the generated loader is absent so callers can fall back in source-only installs. */
export function loadNativeBinding(): NativeBinding | undefined {
  const bindingPath = resolveBindingPath()
  if (!bindingPath) return undefined

  const require = createRequire(bindingPath)
  return require(bindingPath) as NativeBinding
}

function resolveBindingPath(): string | undefined {
  if (bindingUrl.protocol === 'file:') {
    const bindingPath = fileURLToPath(bindingUrl)
    if (existsSync(bindingPath)) return bindingPath
  }

  return fallbackBindingPaths().find((path) => existsSync(path))
}

function fallbackBindingPaths(): string[] {
  const cwd = process.cwd()
  const paths = [join(cwd, 'packages/compiler/binding.cjs')]

  if (isCompilerPackageRoot(cwd)) {
    paths.unshift(join(cwd, 'binding.cjs'))
  }

  return paths
}

function isCompilerPackageRoot(cwd: string): boolean {
  try {
    const packageJson = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
    return packageJson.name === '@pandacss/compiler'
  } catch {
    return false
  }
}
