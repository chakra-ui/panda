import { mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createNodeDriver } from '../src'

const CONFIG = `export default {
  outdir: 'styled-system',
  include: ['**/*.tsx'],
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  patterns: {
    stack: {
      properties: { gap: {} },
      defaultValues: { gap: '4' },
      transform(props) {
        return { display: 'flex', gap: props.gap }
      },
    },
  },
}
`

describe('createNodeDriver', () => {
  let dir: string

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'panda-driver-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG)
    writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('scans the project via the fs engine and compiles the stylesheet', async () => {
    const driver = await createNodeDriver({ cwd: dir })

    expect(driver.scan()).toHaveLength(1)
    expect(driver.parseFiles().map((report) => ({ ...report, path: report.path.replace(`${dir}/`, '') })))
      .toMatchInlineSnapshot(`
        [
          {
            "path": "App.tsx",
            "cssCalls": 1,
            "cvaCalls": 0,
            "svaCalls": 0,
            "jsxUsages": 0,
            "diagnostics": [],
          },
        ]
      `)
    expect(driver.compile().css).toContain('red')
  })

  it('writes artifacts under outdir via the engine fs, embedding the user transform', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.parseFiles()

    const written = driver.writeArtifacts('styled-system')
    expect(written.some((path) => path.endsWith(join('patterns', 'stack.mjs')))).toBe(true)

    const stack = readFileSync(join(dir, 'styled-system', 'patterns', 'stack.mjs'), 'utf8')
    expect(stack).toContain('display: "flex"')
    expect(stack).not.toContain('(s) => s')
  })

  it('lists watch targets (source patterns, base dirs, config deps)', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    const targets = driver.watchTargets()

    expect(targets.sources).toMatchInlineSnapshot(`
      [
        "**/*.tsx",
      ]
    `)
    expect(targets.dirs).toEqual([dir])
    expect(targets.config).toContain('panda.config.ts')
  })

  it('classifies the config file (and not source files) for watch routing', async () => {
    const driver = await createNodeDriver({ cwd: dir })

    expect(driver.isConfigFile(join(dir, 'panda.config.ts'))).toBe(true)
    expect(driver.isConfigFile(join(dir, 'App.tsx'))).toBe(false)
    expect(driver.isConfigFile(join(dir, 'nested', '..', 'panda.config.ts'))).toBe(true)
  })

  it('detects a stylesheet root by its layer declaration', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    const hasDecl = (css: string) => driver.compiler.hasLayerDeclaration(css)

    expect(hasDecl('@layer reset, base, tokens, recipes, utilities;')).toBe(true)
    expect(hasDecl('@layer reset, base, tokens, recipes, utilities, custom;\n.x {}')).toBe(true) // superset
    expect(hasDecl('@layer base, utilities;')).toBe(false) // missing layers
    expect(hasDecl('.x { color: red }')).toBe(false) // no declaration
    expect(hasDecl('@layer reset { .x {} }')).toBe(false) // a block, not a statement
  })

  it('classifies source files by the configured include/exclude globs', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    const isSource = (file: string) => driver.compiler.isSourceFile(file)

    expect(isSource(join(dir, 'App.tsx'))).toBe(true) // matches **/*.tsx
    expect(isSource(join(dir, 'nested', 'Deep.tsx'))).toBe(true)
    expect(isSource(join(dir, 'notes.md'))).toBe(false) // wrong extension
    expect(isSource(join(dir, 'styled-system', 'css', 'index.mjs'))).toBe(false) // generated output
    expect(isSource('/elsewhere/Other.tsx')).toBe(false) // outside cwd
  })

  it('exposes introspection over the current config', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    expect(driver.introspect.patterns()).toMatchInlineSnapshot(`
      [
        "stack",
      ]
    `)
    // cached handle
    expect(driver.introspect).toBe(driver.introspect)
  })

  it('applies a batch of source changes', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.parseFiles()
    const applied = driver.applyChanges([
      {
        path: join(dir, 'App.tsx'),
        kind: 'change',
        content: "import { css } from '@panda/css'; css({ color: 'blue' })",
      },
      {
        path: join(dir, 'Other.tsx'),
        kind: 'add',
        content: "import { css } from '@panda/css'; css({ color: 'green' })",
      },
    ])
    expect(applied).toMatchInlineSnapshot(`
      [
        true,
        true,
      ]
    `)
    expect(driver.compile().css).toContain('blue')
    expect(driver.compile().css).toContain('green')
  })

  it('reads source changes from disk when content is omitted', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    const file = join(dir, 'DiskChange.tsx')

    writeFileSync(file, "import { css } from '@panda/css'; css({ color: 'purple' })")
    expect(driver.applyChange({ path: file, kind: 'add' })).toBe(true)
    expect(driver.compile().css).toContain('purple')

    writeFileSync(file, "import { css } from '@panda/css'; css({ color: 'orange' })")
    expect(driver.applyChange({ path: file, kind: 'change' })).toBe(true)
    expect(driver.compile().css).toContain('purple')
    expect(driver.compile().css).toContain('orange')
  })
})

describe('createNodeDriver isConfigFile (symlinks)', () => {
  it('matches the config file through a symlinked cwd', async () => {
    const real = realpathSync(mkdtempSync(join(tmpdir(), 'panda-real-')))
    writeFileSync(join(real, 'panda.config.ts'), CONFIG)
    const parent = realpathSync(mkdtempSync(join(tmpdir(), 'panda-link-')))
    const link = join(parent, 'proj')
    try {
      symlinkSync(real, link)
    } catch {
      return // symlinks not permitted (e.g. Windows without privilege) — skip
    }

    const driver = await createNodeDriver({ cwd: link })
    // realpath collapses the symlink, so both the canonical and symlinked paths match.
    expect(driver.isConfigFile(join(real, 'panda.config.ts'))).toBe(true)
    expect(driver.isConfigFile(join(link, 'panda.config.ts'))).toBe(true)

    rmSync(parent, { recursive: true, force: true }) // unlinks the `proj` symlink
    rmSync(real, { recursive: true, force: true })
  })
})

describe('createNodeDriver reload', () => {
  let dir: string

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'panda-driver-reload-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG)
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns a non-empty diff after a config edit', async () => {
    const driver = await createNodeDriver({ cwd: dir })

    writeFileSync(
      join(dir, 'panda.config.ts'),
      CONFIG.replace("defaultValues: { gap: '4' }", "defaultValues: { gap: '8' }"),
    )
    const diff = await driver.reload()

    expect({ hasChanged: diff.hasChanged, dependencies: diff.dependencies, patterns: diff.patterns })
      .toMatchInlineSnapshot(`
        {
          "hasChanged": true,
          "dependencies": [
            "patterns",
          ],
          "patterns": [
            "stack",
          ],
        }
      `)
  })
})
