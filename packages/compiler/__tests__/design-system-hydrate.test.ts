import { createNodeDriver } from '../src'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

describe('hydrateDesignSystem (consumer)', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('re-extracts manifest files from the manifest dir and warns when build info is stale', async () => {
    cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-hydrate-')))
    writeFileTree(cwd, {
      'panda.config.ts': `export default {
        designSystem: '@acme/ds',
        include: ['**/*.tsx'],
      }`,
      'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
      'node_modules/@acme/ds/package.json': json({
        name: '@acme/ds',
        version: '1.0.0',
        exports: {
          './panda.lib.json': './dist/panda.lib.json',
          './preset': './dist/preset.mjs',
        },
      }),
      'node_modules/@acme/ds/dist/panda.lib.json': json({
        schemaVersion: 1,
        name: '@acme/ds',
        version: '1.0.0',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './panda.buildinfo.json',
        files: ['./**/*.{js,mjs}'],
        importMap: {
          css: '@acme/ds/css',
          recipes: '@acme/ds/recipes',
          patterns: '@acme/ds/patterns',
          jsx: '@acme/ds/jsx',
          tokens: '@acme/ds/tokens',
        },
      }),
      'node_modules/@acme/ds/dist/preset.mjs': `export default { theme: { tokens: {} } }`,
      'node_modules/@acme/ds/dist/button.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
      'node_modules/@acme/ds/dist/panda.buildinfo.json': json({
        schemaVersion: 999,
        modules: {},
        atoms: [],
      }),
    })

    const driver = await createNodeDriver({ cwd })
    const codes = (driver.designSystemDiagnostics ?? []).map((d) => d.code)

    expect(codes).toContain('design_system_buildinfo_stale')
    expect(driver.cssgen().css).toContain('rebeccapurple')
  })

  it('throws (fail-closed) when build info is stale and the manifest has no files fallback', async () => {
    cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-hydrate-')))
    writeFileTree(cwd, {
      'panda.config.ts': `export default {
        designSystem: '@acme/ds',
        include: ['**/*.tsx'],
      }`,
      'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
      'node_modules/@acme/ds/package.json': json({
        name: '@acme/ds',
        version: '1.0.0',
        exports: {
          './panda.lib.json': './dist/panda.lib.json',
          './preset': './dist/preset.mjs',
        },
      }),
      'node_modules/@acme/ds/dist/panda.lib.json': json({
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
      }),
      'node_modules/@acme/ds/dist/preset.mjs': `export default { theme: { tokens: {} } }`,
      'node_modules/@acme/ds/dist/button.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
      'node_modules/@acme/ds/dist/panda.buildinfo.json': json({
        schemaVersion: 999,
        modules: {},
        atoms: [],
      }),
    })

    await expect(createNodeDriver({ cwd })).rejects.toThrow(/incompatible buildInfo/)
  })

  it('warns on a token defined by both the design system and the consumer', async () => {
    cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-hydrate-')))
    writeFileTree(cwd, {
      'panda.config.ts': `export default {
        designSystem: '@acme/ds',
        include: ['**/*.tsx'],
        theme: {
          tokens: {
            colors: {
              brand: { value: 'red' },
            },
          },
        },
      }`,
      'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
      'node_modules/@acme/ds/package.json': json({
        name: '@acme/ds',
        version: '1.0.0',
        exports: { './panda.lib.json': './dist/panda.lib.json', './preset': './dist/preset.mjs' },
      }),
      'node_modules/@acme/ds/dist/panda.lib.json': json({
        schemaVersion: 1,
        name: '@acme/ds',
        version: '1.0.0',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './panda.buildinfo.json',
        files: ['./**/*.{js,mjs}'],
        importMap: {
          css: '@acme/ds/css',
          recipes: '@acme/ds/recipes',
          patterns: '@acme/ds/patterns',
          jsx: '@acme/ds/jsx',
          tokens: '@acme/ds/tokens',
        },
      }),
      'node_modules/@acme/ds/dist/preset.mjs': `export default {
        theme: {
          tokens: {
            colors: {
              brand: { value: 'blue' },
            },
          },
        },
      }`,
      'node_modules/@acme/ds/dist/button.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
      'node_modules/@acme/ds/dist/panda.buildinfo.json': json({
        schemaVersion: 999,
        modules: {},
        atoms: [],
      }),
    })

    const driver = await createNodeDriver({ cwd })
    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_token_conflict')

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].message).toContain('colors.brand')
  })

  it('warns on a conflict after resolving mixed token authoring forms', async () => {
    cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-hydrate-')))
    writeFileTree(cwd, {
      'panda.config.ts': `export default {
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
      'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
      'node_modules/@acme/ds/package.json': json({
        name: '@acme/ds',
        version: '1.0.0',
        exports: { './panda.lib.json': './dist/panda.lib.json', './preset': './dist/preset.mjs' },
      }),
      'node_modules/@acme/ds/dist/panda.lib.json': json({
        schemaVersion: 1,
        name: '@acme/ds',
        version: '1.0.0',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './panda.buildinfo.json',
        files: ['./**/*.{js,mjs}'],
        importMap: {
          css: '@acme/ds/css',
          recipes: '@acme/ds/recipes',
          patterns: '@acme/ds/patterns',
          jsx: '@acme/ds/jsx',
          tokens: '@acme/ds/tokens',
        },
      }),
      'node_modules/@acme/ds/dist/preset.mjs': `export default {
        theme: {
          tokens: {
            colors: {
              brand: { value: 'blue' },
            },
          },
        },
      }`,
      'node_modules/@acme/ds/dist/button.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
      'node_modules/@acme/ds/dist/panda.buildinfo.json': json({
        schemaVersion: 999,
        modules: {},
        atoms: [],
      }),
    })

    const driver = await createNodeDriver({ cwd })
    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_token_conflict')

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].message).toContain('colors.brand')
  })
})

// Fixture helpers

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
