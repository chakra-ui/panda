import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createNodeDriver } from '../src'

const DEFAULT_CONFIG = `export default { designSystem: '@acme/ds', include: ['**/*.tsx'] }`

describe('hydrateDesignSystem (consumer)', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('re-extracts manifest files from the manifest dir and warns when build info is stale', async () => {
    cwd = createFixture({
      manifest: { files: ['./button.js'] },
      buildInfo: staleBuildInfo(),
    })

    const driver = await createNodeDriver({ cwd })
    const stale = (driver.designSystemDiagnostics ?? []).find((d) => d.code === 'design_system_buildinfo_stale')

    expect({
      severity: stale?.severity,
      category: stale?.category,
      file: stale?.file?.split('/').at(-1),
      message: stale?.message,
      help: stale?.help,
    }).toMatchInlineSnapshot(`
      {
        "severity": "warning",
        "category": "designSystem",
        "file": "panda.buildinfo.json",
        "message": ""@acme/ds" build info uses schemaVersion 999; expected 4. Re-extracted 1 source file.",
        "help": [
          "Run \`panda lib\` in "@acme/ds" to rebuild panda.buildinfo.json.",
        ],
      }
    `)
    expect(driver.cssgen().css).toContain('rebeccapurple')

    writeFileTree(cwd, {
      'node_modules/@acme/ds/dist/button.js': "import { css } from '@acme/ds/css'\ncss({ color: 'dodgerblue' })",
    })

    expect(driver.syncDesignSystemSources()).toEqual([true])
    expect(driver.cssgen().css).toContain('rebeccapurple')
    expect(driver.cssgen().css).toContain('dodgerblue')
  })

  it('throws (fail-closed) when build info is stale and the manifest has no files fallback', async () => {
    cwd = createFixture({ buildInfo: staleBuildInfo() })

    await expect(createNodeDriver({ cwd })).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_buildinfo_stale',
          severity: 'error',
          message: expect.stringMatching(/uses schemaVersion 999; expected 4\. No fallback source files/),
        },
      ],
    })
  })

  it('fails closed when the manifest Panda range is incompatible even when files are present', async () => {
    cwd = createFixture({ manifest: { panda: '^999.0.0', files: ['./button.js'] } })

    await expect(createNodeDriver({ cwd })).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_peer_range_unsatisfied', severity: 'error' }],
    })
  })

  it('re-extracts when build info is structurally invalid but files are present', async () => {
    cwd = createFixture({
      manifest: { files: ['./button.js'] },
      buildInfo: { schemaVersion: 4 },
    })

    const driver = await createNodeDriver({ cwd })
    const stale = (driver.designSystemDiagnostics ?? []).find((d) => d.code === 'design_system_buildinfo_stale')
    expect(stale?.message).toMatch(/malformed or corrupt\. Re-extracted 1 source file\./)
    expect(driver.cssgen().css).toContain('rebeccapurple')
  })

  it('reports a build-info read failure separately from schema and structure failures', async () => {
    cwd = createFixture({
      manifest: { files: ['./button.js'] },
      buildInfo: '{ invalid json',
    })

    const driver = await createNodeDriver({ cwd })
    const stale = (driver.designSystemDiagnostics ?? []).find((d) => d.code === 'design_system_buildinfo_stale')
    expect(stale?.message).toMatch(/could not be read:.*Re-extracted 1 source file\./)
  })

  it('re-extracts source with consumer class-name options instead of loading incompatible build info', async () => {
    cwd = createFixture({
      config: `export default { designSystem: '@acme/ds', hash: true, include: ['**/*.tsx'] }`,
      manifest: { files: ['./button.js'] },
    })

    const driver = await createNodeDriver({ cwd })
    const diagnostic = (driver.designSystemDiagnostics ?? []).find(
      (entry) => entry.code === 'design_system_option_mismatch',
    )

    expect({
      severity: diagnostic?.severity,
      category: diagnostic?.category,
      message: diagnostic?.message,
      help: diagnostic?.help,
    }).toMatchInlineSnapshot(`
      {
        "severity": "warning",
        "category": "designSystem",
        "message": ""@acme/ds" was built with different hash. Re-extracted 1 source file with the consumer options.",
        "help": [
          "Match hash with "@acme/ds", or rebuild it with \`panda lib\`.",
        ],
      }
    `)
    expect(driver.cssgen().css).toContain('rebeccapurple')
  })

  it('fails closed on class-name option mismatch when no fallback sources are published', async () => {
    cwd = createFixture({
      config: `export default { designSystem: '@acme/ds', hash: true, include: ['**/*.tsx'] }`,
    })

    await expect(createNodeDriver({ cwd })).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_option_mismatch',
          severity: 'error',
          message: expect.stringContaining('No fallback source files were available'),
        },
      ],
    })
  })

  it('keeps runtime token references from hydrated build info during token pruning', async () => {
    cwd = createFixture({
      app: 'export const App = () => null',
      manifest: { importMap: { tokens: '@acme/ds/tokens' } },
      preset: `export default {
        optimize: { removeUnusedTokens: true },
        theme: {
          tokens: {
            colors: {
              red: { value: '#f00' },
              blue: { value: '#00f' },
            },
          },
        },
      }`,
      buildInfo: {
        schemaVersion: 4,
        panda: '^2.0.0',
        configFingerprint: 'cfg1-test',
        strings: ['colors.red'],
        atoms: [],
        tokenRefs: [0],
        modules: { 'tokens.ts': { tokenRefs: [0] } },
      },
    })

    const css = (await createNodeDriver({ cwd })).cssgen().css
    expect(css).toContain('--colors-red: #f00')
    expect(css).not.toContain('--colors-blue')
  })

  it('groups token conflicts from one design system into one informational diagnostic', async () => {
    cwd = createFixture({
      config: `export default {
        designSystem: '@acme/ds',
        include: ['**/*.tsx'],
        theme: {
          tokens: {
            colors: {
              brand: { value: 'red' },
              accent: { value: 'red' },
              muted: { value: 'red' },
              surface: { value: 'red' },
            },
          },
        },
      }`,
      manifest: { files: ['./**/*.{js,mjs}'] },
      preset: `export default {
        theme: {
          tokens: {
            colors: {
              brand: { value: 'blue' },
              accent: { value: 'blue' },
              muted: { value: 'blue' },
              surface: { value: 'blue' },
            },
          },
        },
      }`,
      buildInfo: staleBuildInfo(),
    })

    const driver = await createNodeDriver({ cwd })
    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_token_conflict')

    expect(conflicts.map(({ code, severity, message }) => ({ code, severity, message }))).toMatchInlineSnapshot(`
      [
        {
          "code": "design_system_token_conflict",
          "severity": "info",
          "message": "4 token paths are defined by both "@acme/ds" and this config ("colors.accent", "colors.brand", "colors.muted" and 1 more); the local values win.",
        },
      ]
    `)
  })

  it('warns on a conflict after resolving mixed token authoring forms', async () => {
    cwd = createFixture({
      config: `export default {
        designSystem: '@acme/ds',
        include: ['**/*.tsx'],
        theme: {
          extend: {
            tokens: {
              colors: {
                brand: { value: 'red' },
              },
            },
          },
        },
      }`,
      manifest: { files: ['./**/*.{js,mjs}'] },
      preset: `export default {
        theme: {
          tokens: {
            colors: {
              brand: { value: 'blue' },
            },
          },
        },
      }`,
      buildInfo: staleBuildInfo(),
    })

    const driver = await createNodeDriver({ cwd })
    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_token_conflict')

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].message).toContain('colors.brand')
  })
})

interface DesignSystemFixture {
  config?: string
  app?: string
  manifest?: Record<string, unknown>
  preset?: string
  source?: string
  buildInfo?: unknown
}

function createFixture(options: DesignSystemFixture = {}): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-hydrate-')))
  const buildInfo =
    typeof options.buildInfo === 'string' ? options.buildInfo : json(options.buildInfo ?? validBuildInfo())

  writeFileTree(root, {
    'panda.config.ts': options.config ?? DEFAULT_CONFIG,
    'App.tsx': options.app ?? "import { css } from '@panda/css'; css({ color: 'red' })",
    'node_modules/@acme/ds/package.json': json({
      name: '@acme/ds',
      version: '1.0.0',
      exports: { './panda.lib.json': './dist/panda.lib.json', './preset': './dist/panda.preset.mjs' },
    }),
    'node_modules/@acme/ds/dist/panda.lib.json': json({
      schemaVersion: 1,
      name: '@acme/ds',
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './panda.preset.mjs',
      buildInfo: './panda.buildinfo.json',
      importMap: { css: '@acme/ds/css' },
      ...options.manifest,
    }),
    'node_modules/@acme/ds/dist/panda.preset.mjs': options.preset ?? `export default { theme: { tokens: {} } }`,
    'node_modules/@acme/ds/dist/button.js':
      options.source ?? "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
    'node_modules/@acme/ds/dist/panda.buildinfo.json': buildInfo,
  })

  return root
}

function validBuildInfo(): Record<string, unknown> {
  return {
    schemaVersion: 4,
    panda: '^2.0.0',
    configFingerprint: 'cfg1-test',
    strings: [],
    atoms: [],
    modules: {},
  }
}

function staleBuildInfo(): Record<string, unknown> {
  return { schemaVersion: 999, modules: {}, atoms: [] }
}

function writeFileTree(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
