import { describe, expect, test } from 'vitest'
import { defaultImportMap, resolvePublishedPandaRange, syncExports } from '../../src/design-system/package'

describe('design-system/package', () => {
  test('publishes a workspace:* Panda peer as a caret range on the installed major', () => {
    expect(resolvePublishedPandaRange('workspace:*', '2.0.0-beta.8')).toBe('^2.0.0')
  })

  test('publishes a workspace:^ Panda peer as a caret range on the installed major', () => {
    expect(resolvePublishedPandaRange('workspace:^', '2.0.0-beta.8')).toBe('^2.0.0')
  })

  test('publishes a workspace:~ Panda peer as a tilde range on the installed major', () => {
    expect(resolvePublishedPandaRange('workspace:~', '2.0.0-beta.8')).toBe('~2.0.0')
  })

  test('publishes a catalog: Panda peer as a caret range on the installed major', () => {
    expect(resolvePublishedPandaRange('catalog:', '2.0.0-beta.8')).toBe('^2.0.0')
  })

  test('strips the workspace: protocol from an explicit workspace range', () => {
    expect(resolvePublishedPandaRange('workspace:^2.1.0', '2.0.0-beta.8')).toBe('^2.1.0')
  })

  test('keeps a plain semver Panda range as-is', () => {
    expect(resolvePublishedPandaRange('^2.2.0', '2.0.0-beta.8')).toBe('^2.2.0')
  })

  test('uses the version of an npm: alias to @pandacss/dev', () => {
    expect(resolvePublishedPandaRange('npm:@pandacss/dev@^3.0.0', '2.0.0-beta.8')).toBe('^3.0.0')
  })

  test('uses the version of an npm: alias whose package name contains a digit', () => {
    expect(resolvePublishedPandaRange('npm:some2pkg@^3.0.0', '2.0.0-beta.8')).toBe('^3.0.0')
  })

  test('keeps the wildcard fallback when no Panda peer is declared', () => {
    expect(resolvePublishedPandaRange(undefined, '2.0.0-beta.8')).toBe('*')
  })

  test('falls back to the installed major for an npm: alias without a version', () => {
    expect(resolvePublishedPandaRange('npm:@pandacss/dev', '2.0.0-beta.8')).toBe('^2.0.0')
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
    const pkg = JSON.stringify({ name: '@acme/ds', exports: { './panda/*': './dist/panda/*' } })
    const first = syncExports({
      packageJson: pkg,
      entries: { './panda/*': './dist/panda/*' },
    })
    expect(first.changed).toBe(false)

    const second = syncExports({
      packageJson: first.json,
      entries: { './panda/*': './dist/panda/*' },
    })
    expect(second.changed).toBe(false)
    expect(second.json).toBe(first.json)
  })

  test('syncExports preserves a user-owned ./preset export', () => {
    const result = syncExports({
      packageJson: JSON.stringify({
        name: '@acme/ds',
        exports: {
          './preset': './src/preset.ts',
          './css': './styled-system/css/index.js',
        },
      }),
      entries: { './panda/*': './dist/panda/*' },
    })

    expect(result.conflicts).toEqual([])
    const parsed = JSON.parse(result.json)
    expect(parsed.exports['./preset']).toBe('./src/preset.ts')
    expect(parsed.exports['./panda/*']).toBe('./dist/panda/*')
  })

  test('syncExports preserves other package fields', () => {
    const pkg = JSON.stringify({ name: '@acme/ds', version: '1.0.0' })
    const { json } = syncExports({ packageJson: pkg, entries: { './panda/*': './dist/panda/*' } })
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('@acme/ds')
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.exports['./panda/*']).toBe('./dist/panda/*')
  })

  test('syncExports preserves string root exports', () => {
    const { json } = syncExports({
      packageJson: JSON.stringify({ name: '@acme/ds', exports: './dist/index.js' }),
      entries: { './panda/*': './dist/panda/*' },
    })
    const parsed = JSON.parse(json)
    expect(parsed.exports['.']).toBe('./dist/index.js')
    expect(parsed.exports['./panda/*']).toBe('./dist/panda/*')
  })

  test('syncExports preserves conditional root exports', () => {
    const root = { import: './dist/index.mjs', require: './dist/index.cjs', types: './dist/index.d.ts' }
    const { json } = syncExports({
      packageJson: JSON.stringify({ name: '@acme/ds', exports: root }),
      entries: { './panda/*': './dist/panda/*' },
    })
    const parsed = JSON.parse(json)
    expect(parsed.exports['.']).toEqual(root)
    expect(parsed.exports['./panda/*']).toBe('./dist/panda/*')
  })

  test('syncExports preserves an array-form root export instead of dropping it', () => {
    const array = ['./dist/index.mjs', './dist/fallback.js']
    const { json } = syncExports({
      packageJson: JSON.stringify({ name: '@acme/ds', exports: array }),
      entries: { './panda/*': './dist/panda/*' },
    })
    const parsed = JSON.parse(json)
    expect(parsed.exports['.']).toEqual(array)
    expect(parsed.exports['./panda/*']).toBe('./dist/panda/*')
  })

  test('syncExports reports a conflict when overwriting a differing subpath', () => {
    const result = syncExports({
      packageJson: JSON.stringify({ name: '@acme/ds', exports: { './panda/*': './custom/panda/*' } }),
      entries: { './panda/*': './dist/panda/*' },
    })
    expect(result.conflicts).toEqual(['./panda/*'])
    expect(JSON.parse(result.json).exports['./panda/*']).toBe('./dist/panda/*')
  })

  test('syncExports does not report a conflict when the subpath value is identical', () => {
    const result = syncExports({
      packageJson: JSON.stringify({ name: '@acme/ds', exports: { './panda/*': './dist/panda/*' } }),
      entries: { './panda/*': './dist/panda/*' },
    })
    expect(result.conflicts).toEqual([])
  })
})
