import { describe, expect, test } from 'vitest'
import { defaultImportMap, syncExports } from '../src/lib-manifest'

describe('lib-manifest', () => {
  test('derives importMap roots from the package name', () => {
    const map = defaultImportMap('@acme/ds')
    expect(map.css).toBe('@acme/ds/css')
    expect(map.recipes).toBe('@acme/ds/recipes')
    expect(map.patterns).toBe('@acme/ds/patterns')
    expect(map.jsx).toBe('@acme/ds/jsx')
    expect(map.tokens).toBe('@acme/ds/tokens')
  })

  test('syncExports merges entries and is idempotent', () => {
    const pkg = JSON.stringify({ name: '@acme/ds', exports: { './preset': './dist/preset.mjs' } })
    const first = syncExports(pkg, {
      './preset': './dist/preset.mjs',
      './panda.lib.json': './dist/panda.lib.json',
    })
    expect(first.changed).toBe(true)

    const second = syncExports(first.json, {
      './preset': './dist/preset.mjs',
      './panda.lib.json': './dist/panda.lib.json',
    })
    expect(second.changed).toBe(false)
    expect(second.json).toBe(first.json)
  })

  test('syncExports preserves other package fields', () => {
    const pkg = JSON.stringify({ name: '@acme/ds', version: '1.0.0' })
    const { json } = syncExports(pkg, { './panda.lib.json': './dist/panda.lib.json' })
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('@acme/ds')
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.exports['./panda.lib.json']).toBe('./dist/panda.lib.json')
  })
})
