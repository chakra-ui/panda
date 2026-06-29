import { describe, expect, it } from 'vitest'
import { resolveWebContainerBinding } from '../src/load-binary'

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
