import { createNodeDriver } from '../src'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const FALLBACK_FILES = ['./**/*.{js,mjs}']

interface DsOptions {
  files?: string[]
  brandToken?: boolean
  extend?: boolean
}

function createConsumerFixture(options: DsOptions = {}): string {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-hydrate-')))
  const consumerTokens = `tokens: { colors: { brand: { value: 'red' } } }`
  const consumerTheme = options.extend ? `theme: { extend: { ${consumerTokens} } }` : `theme: { ${consumerTokens} }`
  writeFileSync(
    join(cwd, 'panda.config.ts'),
    `export default {
      designSystem: '@acme/ds',
      include: ['**/*.tsx'],
      ${consumerTheme},
    }`,
  )
  writeFileSync(join(cwd, 'App.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")

  const pkg = join(cwd, 'node_modules', '@acme', 'ds')
  const dist = join(pkg, 'dist')
  mkdirSync(dist, { recursive: true })
  writeFileSync(
    join(pkg, 'package.json'),
    JSON.stringify({
      name: '@acme/ds',
      version: '1.0.0',
      exports: { './panda.lib.json': './dist/panda.lib.json', './preset': './dist/preset.mjs' },
    }),
  )
  writeFileSync(
    join(dist, 'panda.lib.json'),
    JSON.stringify({
      schemaVersion: 1,
      name: '@acme/ds',
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './panda.buildinfo.json',
      importMap: {
        css: '@acme/ds/css',
        recipes: '@acme/ds/recipes',
        patterns: '@acme/ds/patterns',
        jsx: '@acme/ds/jsx',
        tokens: '@acme/ds/tokens',
      },
      ...(options.files ? { files: options.files } : {}),
    }),
  )
  const presetTokens = options.brandToken ? `tokens: { colors: { brand: { value: 'blue' } } }` : `tokens: {}`
  const presetTheme = options.extend ? `theme: { extend: { ${presetTokens} } }` : `theme: { ${presetTokens} }`
  writeFileSync(join(dist, 'preset.mjs'), `export default { ${presetTheme} }`)
  writeFileSync(join(dist, 'button.js'), "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })")
  // Intentionally incompatible build info so hydrate fails and the fallback path runs.
  writeFileSync(join(dist, 'panda.buildinfo.json'), JSON.stringify({ schemaVersion: 999, modules: {}, atoms: [] }))
  return cwd
}

describe('hydrateDesignSystem (consumer)', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('re-extracts manifest files from the manifest dir and warns when build info is stale', async () => {
    cwd = createConsumerFixture({ files: FALLBACK_FILES })
    const driver = await createNodeDriver({ cwd })
    const codes = (driver.designSystemDiagnostics ?? []).map((d) => d.code)
    expect(codes).toContain('design_system_buildinfo_stale')
    expect(driver.cssgen().css).toContain('rebeccapurple')
  })

  it('throws (fail-closed) when build info is stale and the manifest has no files fallback', async () => {
    cwd = createConsumerFixture({})
    await expect(createNodeDriver({ cwd })).rejects.toThrow(/incompatible buildInfo/)
  })

  it('warns on a token defined by both the design system and the consumer', async () => {
    cwd = createConsumerFixture({ files: FALLBACK_FILES, brandToken: true })
    const driver = await createNodeDriver({ cwd })
    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_token_conflict')
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].message).toContain('colors.brand')
  })

  it('warns on a conflicting token when both sides declare it under theme.extend', async () => {
    cwd = createConsumerFixture({ files: FALLBACK_FILES, brandToken: true, extend: true })
    const driver = await createNodeDriver({ cwd })
    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_token_conflict')
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].message).toContain('colors.brand')
  })
})
