import { describe, expect, test } from 'vitest'
import { defaultImportMap, resolvePublishedPandaRange, syncExports } from '../src/lib-manifest'

describe('lib-manifest', () => {
  test.each([
    ['workspace:*', '^2.0.0'],
    ['workspace:^', '^2.0.0'],
    ['workspace:~', '~2.0.0'],
    ['catalog:', '^2.0.0'],
    ['workspace:^2.1.0', '^2.1.0'],
    ['^2.2.0', '^2.2.0'],
  ])('normalizes a publish-time Panda range of %s', (range, expected) => {
    expect(resolvePublishedPandaRange(range, '2.0.0-beta.8')).toBe(expected)
  })

  test('keeps the wildcard fallback when no Panda peer is declared', () => {
    expect(resolvePublishedPandaRange(undefined, '2.0.0-beta.8')).toBe('*')
  })

  test('derives importMap roots from the package name', () => {
    const map = defaultImportMap('@acme/ds')
    expect(map.css).toBe('@acme/ds/css')
    expect(map.recipes).toBe('@acme/ds/recipes')
    expect(map.patterns).toBe('@acme/ds/patterns')
    expect(map.jsx).toBe('@acme/ds/jsx')
    expect(map.tokens).toBe('@acme/ds/tokens')
  })

  test('syncExports merges entries and is idempotent', () => {
    const pkg = JSON.stringify({ name: '@acme/ds', exports: { './preset': './dist/panda.preset.mjs' } })
    const first = syncExports({
      packageJson: pkg,
      entries: {
        './preset': './dist/panda.preset.mjs',
        './panda.lib.json': './dist/panda.lib.json',
      },
    })
    expect(first.changed).toBe(true)

    const second = syncExports({
      packageJson: first.json,
      entries: {
        './preset': './dist/panda.preset.mjs',
        './panda.lib.json': './dist/panda.lib.json',
      },
    })
    expect(second.changed).toBe(false)
    expect(second.json).toBe(first.json)
  })

  test('syncExports preserves other package fields', () => {
    const pkg = JSON.stringify({ name: '@acme/ds', version: '1.0.0' })
    const { json } = syncExports({ packageJson: pkg, entries: { './panda.lib.json': './dist/panda.lib.json' } })
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('@acme/ds')
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.exports['./panda.lib.json']).toBe('./dist/panda.lib.json')
  })

  test('syncExports preserves string root exports', () => {
    const { json } = syncExports({
      packageJson: JSON.stringify({ name: '@acme/ds', exports: './dist/index.js' }),
      entries: { './panda.lib.json': './dist/panda.lib.json' },
    })
    const parsed = JSON.parse(json)
    expect(parsed.exports['.']).toBe('./dist/index.js')
    expect(parsed.exports['./panda.lib.json']).toBe('./dist/panda.lib.json')
  })

  test('syncExports preserves conditional root exports', () => {
    const root = { import: './dist/index.mjs', require: './dist/index.cjs', types: './dist/index.d.ts' }
    const { json } = syncExports({
      packageJson: JSON.stringify({ name: '@acme/ds', exports: root }),
      entries: { './panda.lib.json': './dist/panda.lib.json' },
    })
    const parsed = JSON.parse(json)
    expect(parsed.exports['.']).toEqual(root)
    expect(parsed.exports['./panda.lib.json']).toBe('./dist/panda.lib.json')
  })
})
