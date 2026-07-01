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
    expect(recipesIndex).toContain("export { badge, button } from '@acme/ds/recipes';")
    expect(recipesIndex).toContain("export * from './card';")

    expect(has(files, 'recipes/card')).toBe(true)
    expect(has(files, 'recipes/button')).toBe(false)
    expect(has(files, 'recipes/badge')).toBe(false)

    // The generic runtime the app's own recipe imports stays local.
    expect(has(files, 'css/cx')).toBe(true)
    expect(has(files, 'helpers')).toBe(true)

    expect((driver.designSystemDiagnostics ?? []).map((d) => d.code)).not.toContain('design_system_artifact_conflict')
  })

  it('lets the app win a recipe name and warns on the conflict', async () => {
    cwd = setup({ button: recipe('button'), card: recipe('card') })
    const driver = await createNodeDriver({ cwd })
    const files = artifactFiles(driver)

    const recipesIndex = pick(files, 'recipes/index')
    expect(recipesIndex).toContain("export { badge } from '@acme/ds/recipes';")
    expect(recipesIndex).not.toContain('button }')
    expect(recipesIndex).toContain("export * from './button';")

    expect(has(files, 'recipes/button')).toBe(true)
    expect(has(files, 'recipes/badge')).toBe(false)

    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_artifact_conflict')
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.message).toContain('"button"')
    expect(conflicts[0]?.severity).toBe('warning')
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
      "export { badge, button } from '@acme/ds/recipes';\nexport * from './card';",
    )

    expect(files).toContain('recipes/card.js')
    expect(files).not.toContain('recipes/button.js')
    expect(files).not.toContain('recipes/badge.js')

    // Generic runtime imported by the app's own recipe runtime stays local so the
    // relative imports resolve (this is what a real bundler build needs).
    expect(files).toContain('recipes/runtime.js')
    expect(files).toContain('helpers.js')
    expect(files).toContain('css/cx.js')
  })

  it('lets the app win a recipe name and drops it from the DS re-export', async () => {
    cwd = setup({ button: recipe('button'), card: recipe('card') })
    await codegenToDisk(cwd)

    expect(read(cwd, 'recipes/index.js')).toBe(
      "export { badge } from '@acme/ds/recipes';\nexport * from './button';\nexport * from './card';",
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
      exports: { './panda.lib.json': './dist/panda.lib.json', './preset': './dist/preset.mjs' },
    }),
    'node_modules/@acme/ds/dist/panda.lib.json': json({
      schemaVersion: 1,
      name: '@acme/ds',
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './panda.buildinfo.json',
      files: ['./**/*.js'],
      importMap: {
        css: '@acme/ds/css',
        recipes: '@acme/ds/recipes',
        patterns: '@acme/ds/patterns',
        jsx: '@acme/ds/jsx',
        tokens: '@acme/ds/tokens',
      },
    }),
    'node_modules/@acme/ds/dist/preset.mjs': `export default { jsxFramework: 'react', theme: { recipes: {
      button: ${JSON.stringify(recipe('button'))},
      badge: ${JSON.stringify(recipe('badge'))},
    } } }`,
    'node_modules/@acme/ds/dist/comp.js': "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
    'node_modules/@acme/ds/dist/panda.buildinfo.json': json({ schemaVersion: 999, modules: {}, atoms: [] }),
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
