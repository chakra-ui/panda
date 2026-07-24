import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createNodeDriver } from '../../src'

/**
 * Full local re-emit: consumer codegen from the merged designSystem config must
 * include parent + leaf tokens in outdir types (interim path before overlay).
 */
describe('designSystem consumer codegen (full re-emit)', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('emits parent and leaf design-system tokens into local types/tokens.d.ts', async () => {
    cwd = createNestedDesignSystemFixture()

    const driver = await createNodeDriver({ cwd })
    driver.codegen()

    const tokensDts = readFileSync(join(cwd, 'styled-system', 'types', 'tokens.d.ts'), 'utf8')

    expect(tokensDts).toContain('"bg.neutral"')
    expect(tokensDts).toContain('"accent"')
    expect(tokensDts).toMatch(/export type ColorToken =[\s\S]*"accent"[\s\S]*"bg\.neutral"/)
  })
})

function createNestedDesignSystemFixture(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-codegen-')))

  // Chain: app → @acme/marketing → @acme/foundations (nested under marketing)
  const marketingDir = join(root, 'node_modules', '@acme', 'marketing')
  const foundationsDir = join(marketingDir, 'node_modules', '@acme', 'foundations')

  writeFileTree(root, {
    'panda.config.ts': `export default {
  designSystem: '@acme/marketing',
  include: ['**/*.tsx'],
  outdir: 'styled-system',
}`,
    'App.tsx': "import { css } from 'styled-system/css'; css({ color: 'bg.neutral' })",
  })

  writeDesignSystemPackage({
    dir: foundationsDir,
    name: '@acme/foundations',
    preset: `export default {
  name: '@acme/foundations',
  theme: {
    tokens: {
      colors: {
        bg: {
          neutral: { value: '#f5f5f5' },
        },
      },
    },
  },
}`,
  })

  writeDesignSystemPackage({
    dir: marketingDir,
    name: '@acme/marketing',
    designSystem: '@acme/foundations',
    preset: `export default {
  name: '@acme/marketing',
  theme: {
    tokens: {
      colors: {
        accent: { value: '#ff00aa' },
      },
    },
  },
}`,
  })

  return root
}

function writeDesignSystemPackage(options: { dir: string; name: string; designSystem?: string; preset: string }): void {
  const { dir, name, designSystem, preset } = options
  writeFileTree(dir, {
    'package.json': json({
      name,
      version: '1.0.0',
      exports: {
        './panda/*': './dist/panda/*',
      },
    }),
    'dist/panda/lib.json': json({
      schemaVersion: 1,
      name,
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './buildinfo.json',
      importMap: {
        css: `${name}/css`,
        recipes: `${name}/recipes`,
        patterns: `${name}/patterns`,
        jsx: `${name}/jsx`,
        tokens: `${name}/tokens`,
      },
      ...(designSystem ? { designSystem } : {}),
    }),
    'dist/panda/preset.mjs': preset,
    'dist/panda/buildinfo.json': json({
      schemaVersion: 5,
      panda: '^2.0.0',
      configFingerprint: 'cfg-test',
      strings: [],
      atoms: [],
      modules: {},
    }),
  })
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
