import { createNodeDriver } from '../src'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

describe('overlay codegen — in-memory artifacts', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('re-exports DS recipes and emits only the app recipe delta', async () => {
    cwd = setup({ card: recipe('card') })
    const driver = await createNodeDriver({ cwd })
    const files = artifactFiles(driver)

    const recipesIndex = pick(files, 'recipes/index')
    expect(recipesIndex).toContain("export * from '@acme/ds/recipes/badge';")
    expect(recipesIndex).toContain("export * from '@acme/ds/recipes/button';")
    expect(recipesIndex).toContain("export * from './card';")

    expect(has(files, 'recipes/card')).toBe(true)
    expect(has(files, 'recipes/button')).toBe(false)
    expect(has(files, 'recipes/badge')).toBe(false)

    expect(has(files, 'css/cx')).toBe(false)
    expect(pick(files, 'helpers')).toContain("export * from '@acme/ds/helpers'")
    expect(pick(files, 'css/index')).toContain("export * from '@acme/ds/css/css'")
    expect(pick(files, 'css/index')).toContain("export * from '@acme/ds/css/cva'")
    expect(pick(files, 'recipes/runtime')).toBe("export * from '@acme/ds/recipes/runtime';")

    expect((driver.designSystemDiagnostics ?? []).map((d) => d.code)).not.toContain('design_system_artifact_conflict')
  })

  it('lets the app win a recipe name and warns on the conflict', async () => {
    cwd = setup({ button: recipe('button'), card: recipe('card') })
    const driver = await createNodeDriver({ cwd })
    const files = artifactFiles(driver)

    const recipesIndex = pick(files, 'recipes/index')
    expect(recipesIndex).toContain("export * from '@acme/ds/recipes/badge';")
    expect(recipesIndex).not.toContain('@acme/ds/recipes/button')
    expect(recipesIndex).toContain("export * from './button';")

    expect(has(files, 'recipes/button')).toBe(true)
    expect(has(files, 'recipes/badge')).toBe(false)

    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_artifact_conflict')
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.message).toContain('"button"')
    expect(conflicts[0]?.severity).toBe('warning')
  })
})

describe('overlay codegen — overlay input', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('keeps css local when the app authors conditions', async () => {
    cwd = setupAppConfig({ conditions: { brand: '&[data-brand]' } })
    const driver = await createNodeDriver({ cwd })
    const overlay = (driver as unknown as { codegenOverlay(): { virtualizeCss: boolean } }).codegenOverlay()

    expect(overlay?.virtualizeCss).toBe(false)
  })

  it('virtualizes css for a pure consumer', async () => {
    cwd = setupAppConfig({})
    const driver = await createNodeDriver({ cwd })
    const overlay = (
      driver as unknown as { codegenOverlay(): { virtualizeHelpers: boolean; virtualizeCss: boolean } }
    ).codegenOverlay()

    expect(overlay?.virtualizeHelpers).toBe(true)
    expect(overlay?.virtualizeCss).toBe(true)
  })

  it('does not treat nested DS presets (conditions/utilities) as app-authored', async () => {
    cwd = setupAppConfigWithNestedDsPreset()
    const driver = await createNodeDriver({ cwd })
    const overlay = (
      driver as unknown as { codegenOverlay(): { virtualizeHelpers: boolean; virtualizeCss: boolean } }
    ).codegenOverlay()

    expect(overlay?.virtualizeHelpers).toBe(true)
    expect(overlay?.virtualizeCss).toBe(true)
  })

  it('keeps css local when the app authors utilities', async () => {
    cwd = setupAppConfig({ utilities: { marginX: { className: 'mx', values: 'spacing' } } })
    const driver = await createNodeDriver({ cwd })
    const overlay = (driver as unknown as { codegenOverlay(): { virtualizeCss: boolean } }).codegenOverlay()

    expect(overlay?.virtualizeCss).toBe(false)
  })

  it('disables the overlay entirely when the app diverges on a global option', async () => {
    cwd = setupAppConfig({ jsxFramework: 'vue' })
    const driver = await createNodeDriver({ cwd })
    const overlay = (driver as unknown as { codegenOverlay(): unknown }).codegenOverlay()

    expect(overlay).toBeUndefined()
  })

  it('stays virtualized when the app repeats the same global option as the design system', async () => {
    cwd = setupAppConfig({ jsxFramework: 'react' })
    const driver = await createNodeDriver({ cwd })
    const overlay = (driver as unknown as { codegenOverlay(): { virtualizeHelpers: boolean } }).codegenOverlay()

    expect(overlay?.virtualizeHelpers).toBe(true)
  })

  it('disables the overlay when the app diverges on shorthands (prop-type surface)', async () => {
    cwd = setupAppConfig({ shorthands: false })
    const driver = await createNodeDriver({ cwd })
    const overlay = (driver as unknown as { codegenOverlay(): unknown }).codegenOverlay()

    expect(overlay).toBeUndefined()
  })

  it('keeps css local when an app preset authors tokens', async () => {
    cwd = setupAppPreset({
      theme: { tokens: { colors: { brand: { value: 'tomato' } } } },
    })
    const driver = await createNodeDriver({ cwd })
    const overlay = (driver as unknown as { codegenOverlay(): { virtualizeCss: boolean } }).codegenOverlay()

    expect(overlay).toBeDefined()
    expect(overlay?.virtualizeCss).toBe(false)
  })
})

describe('overlay codegen — export missing diagnostics', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('surfaces design_system_export_missing when the DS package.json lacks required subpaths', async () => {
    cwd = setupAppConfigExports({
      './panda/*': './dist/panda/*',
    })
    const driver = await createNodeDriver({ cwd })

    const missing = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_export_missing')
    expect(missing.length).toBeGreaterThan(0)
    expect(missing.map((d) => d.message).join('\n')).toContain('./css/*')
  })

  it('surfaces no design_system_export_missing diagnostics when exports cover the required subpaths', async () => {
    cwd = setupAppConfigExports({
      './panda/*': './dist/panda/*',
      './helpers': './dist/helpers.mjs',
      './css': './dist/css/index.mjs',
      './css/*': './dist/css/*.mjs',
    })
    const driver = await createNodeDriver({ cwd })

    const missing = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_export_missing')
    expect(missing).toHaveLength(0)
  })

  it('surfaces design_system_export_missing for a missing bare ./css export', async () => {
    cwd = setupAppConfigExports({
      './panda/*': './dist/panda/*',
      './helpers': './dist/helpers.mjs',
      './css/*': './dist/css/*.mjs',
    })
    const driver = await createNodeDriver({ cwd })

    const missing = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_export_missing')
    expect(missing.map((d) => d.message).join('\n')).toContain('"./css"')
  })
})

describe('overlay codegen — written to disk', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('re-exports DS recipes and writes only the app recipe delta', async () => {
    cwd = setup({ card: recipe('card') })
    const files = await codegenToDisk(cwd)

    expect(read(cwd, 'recipes/index.js')).toBe(
      "export * from '@acme/ds/recipes/badge';\nexport * from '@acme/ds/recipes/button';\nexport * from './card';",
    )

    expect(files).toContain('recipes/card.js')
    expect(files).not.toContain('recipes/button.js')
    expect(files).not.toContain('recipes/badge.js')

    expect(read(cwd, 'recipes/runtime.js')).toBe("export * from '@acme/ds/recipes/runtime';")
    expect(read(cwd, 'helpers.js')).toBe("export * from '@acme/ds/helpers';")
    expect(files).not.toContain('css/cx.js')
    expect(read(cwd, 'css/index.js')).toContain("export * from '@acme/ds/css/css'")
    expect(read(cwd, 'jsx/factory.js')).toBe("export * from '@acme/ds/jsx/factory';")
    expect(read(cwd, 'jsx/helper.js')).toBe("export * from '@acme/ds/jsx/helper';")
    expect(read(cwd, 'jsx/is-valid-prop.js')).toBe("export * from '@acme/ds/jsx/is-valid-prop';")
    expect(read(cwd, 'jsx/create-recipe-context.js')).toBe("export * from '@acme/ds/jsx/create-recipe-context';")
    expect(read(cwd, 'jsx/create-slot-recipe-context.js')).toBe(
      "export * from '@acme/ds/jsx/create-slot-recipe-context';",
    )
  })

  it('lets the app win a recipe name and drops it from the DS re-export', async () => {
    cwd = setup({ button: recipe('button'), card: recipe('card') })
    await codegenToDisk(cwd)

    expect(read(cwd, 'recipes/index.js')).toBe(
      "export * from '@acme/ds/recipes/badge';\nexport * from './button';\nexport * from './card';",
    )
  })
})

async function codegenToDisk(cwd: string): Promise<string[]> {
  const driver = await createNodeDriver({ cwd })
  driver.parseFiles()
  driver.codegen()
  return tree(join(cwd, 'styled-system'))
}

function setup(appRecipes: Record<string, unknown>): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-overlay-')))
  writeFileTree(root, {
    'panda.config.ts': `export default {
      designSystem: '@acme/ds',
      include: ['**/*.tsx'],
      theme: { recipes: ${JSON.stringify(appRecipes)} },
    }`,
    'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
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
      importMap: {
        css: '@acme/ds/css',
        recipes: '@acme/ds/recipes',
        patterns: '@acme/ds/patterns',
        jsx: '@acme/ds/jsx',
        tokens: '@acme/ds/tokens',
      },
    }),
    'node_modules/@acme/ds/dist/panda/preset.mjs': `export default { jsxFramework: 'react', theme: { recipes: {
      button: ${JSON.stringify(recipe('button'))},
      badge: ${JSON.stringify(recipe('badge'))},
    } } }`,
    'node_modules/@acme/ds/dist/comp.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
    'node_modules/@acme/ds/dist/panda/buildinfo.json': json({ schemaVersion: 999, modules: {}, atoms: [] }),
  })
  return root
}

function setupAppConfig(extra: Record<string, unknown>): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-appkeys-')))
  writeFileTree(root, {
    'panda.config.ts': `export default {
      designSystem: '@acme/ds',
      include: ['**/*.tsx'],
      ...${JSON.stringify(extra)},
    }`,
    'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
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
      importMap: {
        css: '@acme/ds/css',
        recipes: '@acme/ds/recipes',
        patterns: '@acme/ds/patterns',
        jsx: '@acme/ds/jsx',
        tokens: '@acme/ds/tokens',
      },
    }),
    'node_modules/@acme/ds/dist/panda/preset.mjs': `export default { jsxFramework: 'react' }`,
    'node_modules/@acme/ds/dist/comp.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
    'node_modules/@acme/ds/dist/panda/buildinfo.json': json({ schemaVersion: 999, modules: {}, atoms: [] }),
  })
  return root
}

/** DS preset pulls in a nested preset that authors conditions/utilities — must not taint the app. */
function setupAppConfigWithNestedDsPreset(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-nested-preset-')))
  writeFileTree(root, {
    'panda.config.ts': `export default {
      designSystem: '@acme/ds',
      include: ['**/*.tsx'],
    }`,
    'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
    'node_modules/@acme/base/package.json': json({ name: '@acme/base', version: '1.0.0', main: './preset.mjs' }),
    'node_modules/@acme/base/preset.mjs': `export default {
      conditions: { brand: '&[data-brand]' },
      utilities: { marginX: { className: 'mx', values: 'spacing' } },
    }`,
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
      importMap: {
        css: '@acme/ds/css',
        recipes: '@acme/ds/recipes',
        patterns: '@acme/ds/patterns',
        jsx: '@acme/ds/jsx',
        tokens: '@acme/ds/tokens',
      },
    }),
    'node_modules/@acme/ds/dist/panda/preset.mjs': `export default {
      jsxFramework: 'react',
      presets: ['@acme/base'],
    }`,
    'node_modules/@acme/ds/dist/comp.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
    'node_modules/@acme/ds/dist/panda/buildinfo.json': json({ schemaVersion: 999, modules: {}, atoms: [] }),
  })
  return root
}

function setupAppPreset(preset: Record<string, unknown>): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-app-preset-')))
  writeFileTree(root, {
    'panda.config.ts': `import appPreset from './app-preset.mjs'
export default {
  designSystem: '@acme/ds',
  include: ['**/*.tsx'],
  presets: [appPreset],
}`,
    'app-preset.mjs': `export default ${JSON.stringify(preset)}`,
    'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
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
      importMap: {
        css: '@acme/ds/css',
        recipes: '@acme/ds/recipes',
        patterns: '@acme/ds/patterns',
        jsx: '@acme/ds/jsx',
        tokens: '@acme/ds/tokens',
      },
    }),
    'node_modules/@acme/ds/dist/panda/preset.mjs': `export default { jsxFramework: 'react' }`,
    'node_modules/@acme/ds/dist/comp.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
    'node_modules/@acme/ds/dist/panda/buildinfo.json': json({ schemaVersion: 999, modules: {}, atoms: [] }),
  })
  return root
}

function setupAppConfigExports(exports: Record<string, string>): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-exports-')))
  writeFileTree(root, {
    'panda.config.ts': `export default {
      designSystem: '@acme/ds',
      include: ['**/*.tsx'],
    }`,
    'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
    'node_modules/@acme/ds/package.json': json({
      name: '@acme/ds',
      version: '1.0.0',
      exports,
    }),
    'node_modules/@acme/ds/dist/panda/lib.json': json({
      schemaVersion: 1,
      name: '@acme/ds',
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './buildinfo.json',
      files: ['./**/*.js'],
      importMap: {
        css: '@acme/ds/css',
        recipes: '@acme/ds/recipes',
        patterns: '@acme/ds/patterns',
        jsx: '@acme/ds/jsx',
        tokens: '@acme/ds/tokens',
      },
    }),
    'node_modules/@acme/ds/dist/panda/preset.mjs': `export default { jsxFramework: 'react' }`,
    'node_modules/@acme/ds/dist/comp.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
    'node_modules/@acme/ds/dist/panda/buildinfo.json': json({ schemaVersion: 999, modules: {}, atoms: [] }),
  })
  return root
}

function recipe(className: string): unknown {
  return { className, base: { display: 'flex' }, variants: {} }
}

function artifactFiles(driver: Awaited<ReturnType<typeof createNodeDriver>>): Map<string, string> {
  const files = new Map<string, string>()
  for (const artifact of driver.artifacts()) {
    for (const file of artifact.files) files.set(file.path, file.code)
  }
  return files
}

function pick(files: Map<string, string>, prefix: string): string {
  for (const [path, code] of files) if (path.startsWith(prefix)) return code
  throw new Error(`no artifact file starting with ${prefix}; got ${[...files.keys()].join(', ')}`)
}

function has(files: Map<string, string>, prefix: string): boolean {
  for (const path of files.keys()) if (path.startsWith(`${prefix}.`)) return true
  return false
}

function read(cwd: string, path: string): string {
  return readFileSync(join(cwd, 'styled-system', path), 'utf8').trim()
}

function tree(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? tree(full, base) : [relative(base, full)]
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
