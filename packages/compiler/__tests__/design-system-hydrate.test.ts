import { createNodeDriver } from '../src'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

interface DsOptions {
  files?: string[]
  brandToken?: boolean
}

function createConsumerFixture(options: DsOptions = {}): string {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-hydrate-')))
  writeFileSync(
    join(cwd, 'panda.config.ts'),
    `export default {
      designSystem: '@acme/ds',
      include: ['**/*.tsx'],
      theme: { tokens: { colors: { brand: { value: 'red' } } } },
    }`,
  )
  writeFileSync(join(cwd, 'App.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")

  const pkg = join(cwd, 'node_modules', '@acme', 'ds')
  mkdirSync(pkg, { recursive: true })
  writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: '@acme/ds', version: '1.0.0' }))
  writeFileSync(
    join(pkg, 'panda.lib.json'),
    JSON.stringify({
      schemaVersion: 1,
      name: '@acme/ds',
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './panda.buildinfo.json',
      ...(options.files ? { files: options.files } : {}),
    }),
  )
  const presetTokens = options.brandToken ? `tokens: { colors: { brand: { value: 'blue' } } }` : `tokens: {}`
  writeFileSync(join(pkg, 'preset.mjs'), `export default { theme: { ${presetTokens} } }`)
  // Intentionally incompatible build info so hydrate fails and the fallback path runs.
  writeFileSync(join(pkg, 'panda.buildinfo.json'), JSON.stringify({ schemaVersion: 999, modules: {}, atoms: [] }))
  return cwd
}

describe('hydrateDesignSystem (consumer)', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('re-extracts manifest files and warns when build info is stale', async () => {
    cwd = createConsumerFixture({ files: ['./dist/**/*.{js,mjs}'] })
    const driver = await createNodeDriver({ cwd })
    const codes = (driver.designSystemDiagnostics ?? []).map((d) => d.code)
    expect(codes).toContain('design_system_buildinfo_stale')
  })

  it('throws (fail-closed) when build info is stale and the manifest has no files fallback', async () => {
    cwd = createConsumerFixture({})
    await expect(createNodeDriver({ cwd })).rejects.toThrow(/incompatible buildInfo/)
  })

  it('warns on a token defined by both the design system and the consumer', async () => {
    cwd = createConsumerFixture({ files: ['./dist/**/*.{js,mjs}'], brandToken: true })
    const driver = await createNodeDriver({ cwd })
    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_token_conflict')
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].message).toContain('colors.brand')
  })
})
