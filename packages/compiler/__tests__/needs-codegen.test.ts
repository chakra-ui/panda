import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createNodeDriver } from '../src'
import { isExternalImportMap } from '../src/external-import-map'

let root: string | undefined

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true })
  root = undefined
})

describe('needsCodegen', () => {
  it('runs codegen without an importMap', async () => {
    const cwd = createApp({ config: {} })
    expect(await needsCodegen(cwd)).toBe(true)
  })

  it('skips codegen when importMap points to an installed workspace package', async () => {
    const cwd = createApp({ config: { importMap: '@acme/ds' }, workspaceDs: true })
    expect(await needsCodegen(cwd)).toBe(false)
  })

  it('skips codegen for an array of installed packages', async () => {
    const cwd = createApp({
      config: { importMap: ['@acme/ds', '@acme/icons'] },
      workspaceDs: true,
      files: { 'node_modules/@acme/icons/package.json': json({ name: '@acme/icons' }) },
    })
    expect(await needsCodegen(cwd)).toBe(false)
  })

  it('runs codegen when the importMap package is not installed', async () => {
    const cwd = createApp({ config: { importMap: '@acme/missing' } })
    expect(await needsCodegen(cwd)).toBe(true)
  })

  it('runs codegen for a tsconfig alias', async () => {
    const cwd = createApp({
      config: { importMap: '@/styled-system' },
      files: { 'tsconfig.json': json({ compilerOptions: { paths: { '@/*': ['./*'] } } }) },
    })
    expect(await needsCodegen(cwd)).toBe(true)
  })

  it('runs codegen for a relative path', async () => {
    const cwd = createApp({ config: { importMap: './styled-system' } })
    expect(await needsCodegen(cwd)).toBe(true)
  })

  it('runs codegen for a partial object form, since missing entries default to the outdir', async () => {
    const cwd = createApp({ config: { importMap: { css: '@acme/ds/css' } }, workspaceDs: true })
    expect(await needsCodegen(cwd)).toBe(true)
  })

  it('skips codegen for a full object form pointing to an installed package', async () => {
    const cwd = createApp({
      config: {
        importMap: {
          css: '@acme/ds/css',
          recipes: '@acme/ds/recipes',
          patterns: '@acme/ds/patterns',
          jsx: '@acme/ds/jsx',
          tokens: '@acme/ds/tokens',
        },
      },
      workspaceDs: true,
    })
    expect(await needsCodegen(cwd)).toBe(false)
  })

  it('runs codegen when local and external entries are mixed', async () => {
    const cwd = createApp({ config: { importMap: ['@acme/ds', './styled-system'] }, workspaceDs: true })
    expect(await needsCodegen(cwd)).toBe(true)
  })

  it('runs codegen when an entry is the outdir name, even if a package with that name is installed', async () => {
    const cwd = createApp({
      config: { importMap: ['@acme/ds', 'styled-system'] },
      workspaceDs: true,
      files: { 'node_modules/styled-system/package.json': json({ name: 'styled-system' }) },
    })
    expect(await needsCodegen(cwd)).toBe(true)
  })

  it('runs codegen when outdir is inside the importMap package', async () => {
    const cwd = createApp({
      config: { importMap: '@acme/own', outdir: 'node_modules/@acme/own' },
      files: { 'node_modules/@acme/own/package.json': json({ name: '@acme/own' }) },
    })
    expect(await needsCodegen(cwd)).toBe(true)
  })

  it('runs codegen when the outdir override points inside the importMap package', async () => {
    const cwd = createApp({ config: { importMap: '@acme/ds' }, workspaceDs: true })
    const driver = await createNodeDriver({ cwd })
    expect(driver.needsCodegen('node_modules/@acme/ds/styled-system')).toBe(true)
  })

  it('re-evaluates after a config reload', async () => {
    const cwd = createApp({ config: { importMap: '@acme/ds' }, workspaceDs: true })
    const driver = await createNodeDriver({ cwd })
    expect(driver.needsCodegen()).toBe(false)

    writeConfig(cwd, { importMap: ['@acme/ds', './styled-system'] })
    await driver.reload()
    expect(driver.needsCodegen()).toBe(true)
  })

  describe('designSystem', () => {
    it('runs codegen for a designSystem app', async () => {
      const cwd = createApp({ config: { designSystem: '@acme/ds' }, installedDs: true })
      expect(await needsCodegen(cwd)).toBe(true)
    })

    it('runs codegen for a designSystem app when a styled-system package is installed', async () => {
      const cwd = createApp({
        config: { designSystem: '@acme/ds' },
        installedDs: true,
        files: { 'node_modules/styled-system/package.json': json({ name: 'styled-system' }) },
      })
      expect(await needsCodegen(cwd)).toBe(true)
    })

    it('runs codegen for a designSystem app with an extra external importMap', async () => {
      const cwd = createApp({
        config: { designSystem: '@acme/ds', importMap: '@acme/icons' },
        installedDs: true,
        files: { 'node_modules/@acme/icons/package.json': json({ name: '@acme/icons' }) },
      })
      expect(await needsCodegen(cwd)).toBe(true)
    })

    it('runs codegen for a designSystem app even when every importMap entry is external', () => {
      const cwd = createApp({ config: {}, workspaceDs: true })
      const importMap = {
        css: ['@acme/ds/css'],
        recipe: ['@acme/ds/recipes'],
        pattern: ['@acme/ds/patterns'],
        jsx: ['@acme/ds/jsx'],
        tokens: ['@acme/ds/tokens'],
      }
      const input = { cwd, outdir: join(cwd, 'styled-system'), importMap }

      expect(isExternalImportMap({ ...input, designSystem: false })).toBe(true)
      expect(isExternalImportMap({ ...input, designSystem: true })).toBe(false)
    })

    it('writes the local outdir for a designSystem app', async () => {
      const cwd = createApp({ config: { designSystem: '@acme/ds' }, installedDs: true })
      const driver = await createNodeDriver({ cwd })
      expect(driver.codegen().length).toBeGreaterThan(0)
    })
  })
})

async function needsCodegen(cwd: string) {
  return (await createNodeDriver({ cwd })).needsCodegen()
}

interface AppFixture {
  config: Record<string, unknown>
  workspaceDs?: boolean
  installedDs?: boolean
  files?: Record<string, string>
}

function createApp({ config, workspaceDs, installedDs, files = {} }: AppFixture): string {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-needs-codegen-')))
  const cwd = join(root, 'apps/web')

  writeTree(cwd, {
    'package.json': json({ name: 'web' }),
    'App.tsx': "import { css } from '@acme/ds/css'; css({ color: 'red' })",
    ...(installedDs ? designSystemPackage() : {}),
    ...files,
  })
  writeConfig(cwd, config)

  if (workspaceDs) {
    writeTree(join(root, 'packages/ds'), { 'package.json': json({ name: '@acme/ds' }) })
    mkdirSync(join(cwd, 'node_modules/@acme'), { recursive: true })
    symlinkSync(join(root, 'packages/ds'), join(cwd, 'node_modules/@acme/ds'), 'dir')
  }

  return cwd
}

function designSystemPackage(): Record<string, string> {
  return {
    'node_modules/@acme/ds/package.json': json({
      name: '@acme/ds',
      version: '1.0.0',
      exports: { './panda/*': './dist/panda/*' },
    }),
    'node_modules/@acme/ds/dist/panda/lib.json': json({
      schemaVersion: 1,
      name: '@acme/ds',
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './buildinfo.json',
      files: ['./**/*.js'],
    }),
    'node_modules/@acme/ds/dist/panda/preset.mjs': `export default ${json({ jsxFramework: 'react' })}`,
    'node_modules/@acme/ds/dist/comp.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
    'node_modules/@acme/ds/dist/panda/buildinfo.json': json({ schemaVersion: 999, modules: {}, atoms: [] }),
  }
}

function writeConfig(cwd: string, config: Record<string, unknown>) {
  writeFileSync(join(cwd, 'panda.config.ts'), `export default { include: ['**/*.tsx'], ...${JSON.stringify(config)} }`)
}

function writeTree(dir: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
}

function json(value: unknown) {
  return JSON.stringify(value, null, 2)
}
