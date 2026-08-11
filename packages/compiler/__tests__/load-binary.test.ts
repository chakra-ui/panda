import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { resolveBindingPath, resolveWebContainerBinding } from '../src/load-binary'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))

const fixturePackage = join(packageRoot, '__tests__', 'fixtures', 'binding-package')
const fixtureEntry = (...segments: string[]) => pathToFileURL(join(fixturePackage, ...segments)).href

describe('locating the native binding', () => {
  // Only present once `build:native` has emitted the loader.
  const rootBinding = join(packageRoot, 'binding.cjs')

  it.skipIf(!existsSync(rootBinding))('resolves it at the package root', () => {
    expect(resolveBindingPath()).toBe(rootBinding)
  })

  it('finds it from an entry the bundler emitted one level below the root', () => {
    expect(resolveBindingPath(fixtureEntry('lib', 'index.js'))).toBe(join(fixturePackage, 'binding.cjs'))
  })

  it('finds it from an entry nested deeper, as the `tooling` entry is', () => {
    expect(resolveBindingPath(fixtureEntry('lib', 'tooling', 'index.js'))).toBe(join(fixturePackage, 'binding.cjs'))
  })

  // Node only self-references subpaths the `exports` map lists.
  it('keeps `./package.json` exported so the root stays self-referenceable', () => {
    expect(createRequire(import.meta.url).resolve('@pandacss/compiler/package.json')).toBe(
      join(packageRoot, 'package.json'),
    )
  })
})

describe('resolveWebContainerBinding', () => {
  it('matches the WebContainer fallback install layout', () => {
    expect(resolveWebContainerBinding('2.0.0-beta.5')).toEqual({
      baseDir: '/tmp/pandacss-compiler-2.0.0-beta.5',
      bindingPackage: '@pandacss/compiler-wasm32-wasi@2.0.0-beta.5',
      bindingEntry: '/tmp/pandacss-compiler-2.0.0-beta.5/node_modules/@pandacss/compiler-wasm32-wasi/compiler.wasi.cjs',
    })
  })

  it('allows a custom root for tests and non-default temp dirs', () => {
    expect(resolveWebContainerBinding('2.0.0-beta.5', '/var/tmp')).toMatchObject({
      baseDir: '/var/tmp/pandacss-compiler-2.0.0-beta.5',
      bindingEntry:
        '/var/tmp/pandacss-compiler-2.0.0-beta.5/node_modules/@pandacss/compiler-wasm32-wasi/compiler.wasi.cjs',
    })
  })
})
