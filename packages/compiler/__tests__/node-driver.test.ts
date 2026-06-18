import { mkdtempSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createNodeDriver } from '../src'

const CONFIG = `import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

export default {
  outdir: 'styled-system',
  forceImportExtension: true,
  include: ['**/*.tsx'],
  plugins: [
    {
      name: 'host',
      hooks: {
        'codegen:prepare': ({ artifacts, outdir, cwd }) => {
          writeFileSync(join(cwd, 'codegen-prepare.json'), JSON.stringify({ count: artifacts.length, outdir }))
          return [
            ...artifacts,
            {
              id: 'custom',
              files: [{ path: 'prepared.txt', code: 'prepared', dependencies: [] }],
            },
          ]
        },
        'codegen:done': ({ files, outdir, cwd }) => {
          writeFileSync(join(cwd, 'codegen-done.json'), JSON.stringify({ files, outdir }))
        },
      },
    },
  ],
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
    expect(driver.cssgen().css).toContain('red')
  })

  it('writes artifacts under outdir via the engine fs, embedding the user transform', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.parseFiles()

    const written = driver.codegen()
    expect(written.some((path) => path.endsWith(join('patterns', 'stack.js')))).toBe(true)

    const stack = readFileSync(join(dir, 'styled-system', 'patterns', 'stack.js'), 'utf8')
    expect(stack).toContain('display: "flex"')
    expect(stack).toContain('./runtime.js')
    expect(stack).not.toContain('(s) => s')
    expect(readFileSync(join(dir, 'styled-system', 'prepared.txt'), 'utf8')).toBe('prepared')

    const prepare = JSON.parse(readFileSync(join(dir, 'codegen-prepare.json'), 'utf8'))
    expect(prepare.count).toBeGreaterThan(0)
    expect(prepare.outdir).toBe(join(dir, 'styled-system'))

    const done = JSON.parse(readFileSync(join(dir, 'codegen-done.json'), 'utf8'))
    expect(done.outdir).toBe(join(dir, 'styled-system'))
    expect(done.files).toContain(join(dir, 'styled-system', 'patterns', 'stack.js'))
    expect(done.files).toContain(join(dir, 'styled-system', 'prepared.txt'))
  })

  it('skips rewriting unchanged codegen outputs in both native and prepare-hook paths', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.parseFiles()

    driver.codegen()
    const nativeTarget = join(dir, 'styled-system', 'patterns', 'stack.js')
    const preparedTarget = join(dir, 'styled-system', 'prepared.txt')
    const before = {
      native: statSync(nativeTarget).mtimeMs,
      prepared: statSync(preparedTarget).mtimeMs,
    }

    await new Promise((resolve) => setTimeout(resolve, 20))
    driver.codegen()
    const after = {
      native: statSync(nativeTarget).mtimeMs,
      prepared: statSync(preparedTarget).mtimeMs,
    }

    expect(after).toEqual(before)
  })

  it('writes stylesheet output through the driver host', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.parseFiles()

    const result = driver.writeCss({ outfile: 'styled-system/styles.css' })

    expect(result.path).toBe(join(dir, 'styled-system', 'styles.css'))
    expect(result.css).toContain('red')
    expect(readFileSync(result.path, 'utf8')).toBe(result.css)
  })

  it('skips rewriting unchanged stylesheet output through the driver host', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.parseFiles()

    const result = driver.writeCss({ outfile: 'styled-system/styles.css' })
    const before = statSync(result.path).mtimeMs

    await new Promise((resolve) => setTimeout(resolve, 20))
    driver.writeCss({ outfile: 'styled-system/styles.css' })
    const after = statSync(result.path).mtimeMs

    expect(after).toBe(before)
  })

  it('writes split stylesheet output under outdir through the driver host', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.parseFiles()

    const result = driver.writeSplitCss()

    expect(result.root).toBe(join(dir, 'styled-system'))
    expect(result.paths).toContain(join(dir, 'styled-system', 'styles.css'))
    expect(result.paths).toContain(join(dir, 'styled-system', 'styles', 'utilities.css'))
    expect(readFileSync(join(dir, 'styled-system', 'styles.css'), 'utf8')).toContain(
      "@import './styles/utilities.css';",
    )
    expect(readFileSync(join(dir, 'styled-system', 'styles', 'utilities.css'), 'utf8')).toContain('red')
  })

  it('skips rewriting unchanged split stylesheet outputs', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.parseFiles()

    driver.writeSplitCss()
    const rootFile = join(dir, 'styled-system', 'styles.css')
    const utilitiesFile = join(dir, 'styled-system', 'styles', 'utilities.css')
    const before = {
      root: statSync(rootFile).mtimeMs,
      utilities: statSync(utilitiesFile).mtimeMs,
    }

    await new Promise((resolve) => setTimeout(resolve, 20))
    driver.writeSplitCss()
    const after = {
      root: statSync(rootFile).mtimeMs,
      utilities: statSync(utilitiesFile).mtimeMs,
    }

    expect(after).toEqual(before)
  })

  it('resolves the configured outdir through the driver host', async () => {
    const driver = await createNodeDriver({ cwd: dir })

    expect(driver.getOutdir()).toBe(join(dir, 'styled-system'))
    expect(driver.getOutdir('system')).toBe(join(dir, 'system'))
    expect(driver.getOutdir('/tmp/panda-system')).toBe('/tmp/panda-system')
    expect(driver.paths('system')).toEqual({
      root: join(dir, 'system'),
      styleFile: join(dir, 'system', 'styles.css'),
      stylesDir: join(dir, 'system', 'styles'),
    })
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
    expect(isSource(join(dir, 'styled-system', 'css', 'index.js'))).toBe(false) // generated output
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
    expect(driver.cssgen().css).toContain('blue')
    expect(driver.cssgen().css).toContain('green')
  })

  it('reads source changes from disk when content is omitted', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    const file = join(dir, 'DiskChange.tsx')

    writeFileSync(file, "import { css } from '@panda/css'; css({ color: 'purple' })")
    expect(driver.applyChange({ path: file, kind: 'add' })).toBe(true)
    expect(driver.cssgen().css).toContain('purple')

    writeFileSync(file, "import { css } from '@panda/css'; css({ color: 'orange' })")
    expect(driver.applyChange({ path: file, kind: 'change' })).toBe(true)
    expect(driver.cssgen().css).toContain('purple')
    expect(driver.cssgen().css).toContain('orange')
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
