import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NativeBinding } from './types'

// napi-generated loader at the package root. Require via a variable so bundlers
// leave it external.
const bindingUrl = new URL('../binding.cjs', import.meta.url)
const webContainerWasiPackage = '@pandacss/compiler-wasm32-wasi'

/** Returns `undefined` when the generated loader is absent so callers can fall back in source-only installs. */
export function loadNativeBinding(): NativeBinding | undefined {
  const bindingPath = resolveBindingPath()
  if (!bindingPath) return undefined

  const require = createRequire(bindingPath)
  try {
    return require(bindingPath) as NativeBinding
  } catch (error) {
    if (!isWebContainer()) throw error
    return loadWebContainerBinding(require, bindingPath, error)
  }
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

export function isWebContainer(): boolean {
  const versions = process.versions as NodeJS.ProcessVersions & { webcontainer?: string }
  return Boolean(versions.webcontainer)
}

export function resolveWebContainerBinding(version: string, root = '/tmp') {
  const baseDir = join(root, `pandacss-compiler-${version}`)
  return {
    baseDir,
    bindingPackage: `${webContainerWasiPackage}@${version}`,
    bindingEntry: join(baseDir, 'node_modules', webContainerWasiPackage, 'compiler.wasi.cjs'),
  }
}

function loadWebContainerBinding(require: NodeJS.Require, bindingPath: string, nativeError: unknown): NativeBinding {
  const version = readCompilerVersion(require, dirname(bindingPath))
  const { baseDir, bindingPackage, bindingEntry } = resolveWebContainerBinding(version)

  if (!existsSync(bindingEntry)) {
    rmSync(baseDir, { recursive: true, force: true })
    mkdirSync(baseDir, { recursive: true })
    execFileSync('pnpm', ['i', bindingPackage], {
      cwd: baseDir,
      stdio: 'inherit',
    })
  }

  try {
    return require(bindingEntry) as NativeBinding
  } catch (fallbackError) {
    throw new Error('Failed to load @pandacss/compiler WebContainer WASI fallback', {
      cause: chainError(nativeError, fallbackError),
    })
  }
}

function readCompilerVersion(require: NodeJS.Require, packageRoot: string): string {
  try {
    const packageJsonPath = require.resolve('@pandacss/compiler/package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    return packageJson.version
  } catch {
    const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
    return packageJson.version
  }
}

function chainError(primary: unknown, cause: unknown): unknown {
  if (primary instanceof Error) {
    primary.cause = cause
    return primary
  }
  return cause
}
