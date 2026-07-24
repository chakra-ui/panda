import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createNodeDriver } from '../src'
import { createProject } from './test-utils'

const CONFIG = `import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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
        'cssgen:done': ({ artifact, content, path, cwd }) => {
          const target = join(cwd, 'cssgen-done.json')
          const prev = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : []
          prev.push({ artifact, bytes: content.length, path: path ?? null })
          writeFileSync(target, JSON.stringify(prev))
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

function writeFileTree(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}

async function captureDesignSystemError(promise: Promise<unknown>) {
  const error = await promise.then(
    () => {
      throw new Error('Expected design-system loading to fail')
    },
    (reason: unknown) => reason,
  )
  const value = error as {
    message?: string
    diagnostics?: Array<{ code: string; severity: string; message: string; help?: string[] }>
  }
  const normalizeVersion = (message: string | undefined) =>
    message?.replace(/; the consumer uses .*\.$/, '; the consumer uses <version>.')

  return {
    diagnostics: value.diagnostics?.map(({ code, severity, message, help }) => ({
      code,
      help,
      message: normalizeVersion(message),
      severity,
    })),
    message: normalizeVersion(value.message),
  }
}

describe('createNodeDriver', () => {
  let dir: string

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'panda-driver-'))
    writeFileTree(dir, {
      'panda.config.ts': CONFIG,
      'App.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
    })
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

  it('runs cssgen:done for string sinks and disk writes', async () => {
    const driver = await createNodeDriver({ cwd: dir })
    driver.parseFiles()
    rmSync(join(dir, 'cssgen-done.json'), { force: true })

    driver.cssgen()
    expect(JSON.parse(readFileSync(join(dir, 'cssgen-done.json'), 'utf8'))).toEqual([
      { artifact: 'styles.css', bytes: expect.any(Number), path: null },
    ])

    rmSync(join(dir, 'cssgen-done.json'), { force: true })
    const written = driver.writeCss({ outfile: 'styled-system/styles.css' })
    expect(JSON.parse(readFileSync(join(dir, 'cssgen-done.json'), 'utf8'))).toEqual([
      { artifact: 'styles.css', bytes: expect.any(Number), path: written.path },
    ])

    rmSync(join(dir, 'cssgen-done.json'), { force: true })
    const layered = driver.writeLayerCss({
      outfile: 'styled-system/minimal.css',
      layers: ['utilities'],
    })
    expect(JSON.parse(readFileSync(join(dir, 'cssgen-done.json'), 'utf8'))).toEqual([
      { artifact: 'styles.layer', bytes: expect.any(Number), path: layered.path },
    ])
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
    rmSync(join(dir, 'cssgen-done.json'), { force: true })

    const result = driver.writeSplitCss()

    expect(result.root).toBe(join(dir, 'styled-system'))
    expect(result.paths).toContain(join(dir, 'styled-system', 'styles.css'))
    expect(result.paths).toContain(join(dir, 'styled-system', 'styles', 'utilities.css'))
    expect(readFileSync(join(dir, 'styled-system', 'styles.css'), 'utf8')).toContain(
      "@import './styles/utilities.css';",
    )
    expect(readFileSync(join(dir, 'styled-system', 'styles', 'utilities.css'), 'utf8')).toContain('red')

    const cssgenDone = JSON.parse(readFileSync(join(dir, 'cssgen-done.json'), 'utf8')) as Array<{
      artifact: string
      path: string | null
    }>
    expect(cssgenDone.every((entry) => entry.artifact === 'styles.split')).toBe(true)
    expect(cssgenDone.map((entry) => entry.path)).toEqual(expect.arrayContaining(result.paths))
  })

  it('carries file diagnostics through every CSS output method', async () => {
    const diagnosticsDir = mkdtempSync(join(tmpdir(), 'panda-driver-diagnostics-'))
    try {
      writeFileTree(diagnosticsDir, {
        'panda.config.ts': CONFIG,
        'App.tsx': "import { css } from '@panda/css'; css({ color: ",
      })
      const driver = await createNodeDriver({ cwd: diagnosticsDir })
      driver.parseFiles()

      const outputs = [
        driver.cssgen(),
        driver.getLayerCss({ layers: ['utilities'] }),
        driver.getKeyframeCss(),
        driver.getSplitCss(),
        driver.writeCss({ outfile: 'styled-system/styles.css' }),
        driver.writeLayerCss({ outfile: 'styled-system/layers.css', layers: ['utilities'] }),
        driver.writeSplitCss(),
      ]

      expect(
        outputs.map((output, index) => ({
          method: [
            'cssgen',
            'getLayerCss',
            'getKeyframeCss',
            'getSplitCss',
            'writeCss',
            'writeLayerCss',
            'writeSplitCss',
          ][index],
          diagnostics: output.diagnostics.map((diagnostic) => diagnostic.code),
        })),
      ).toMatchInlineSnapshot(`
        [
          {
            "method": "cssgen",
            "diagnostics": [
              "js_parse_error",
            ],
          },
          {
            "method": "getLayerCss",
            "diagnostics": [
              "js_parse_error",
            ],
          },
          {
            "method": "getKeyframeCss",
            "diagnostics": [
              "js_parse_error",
            ],
          },
          {
            "method": "getSplitCss",
            "diagnostics": [
              "js_parse_error",
            ],
          },
          {
            "method": "writeCss",
            "diagnostics": [
              "js_parse_error",
            ],
          },
          {
            "method": "writeLayerCss",
            "diagnostics": [
              "js_parse_error",
            ],
          },
          {
            "method": "writeSplitCss",
            "diagnostics": [
              "js_parse_error",
            ],
          },
        ]
      `)
    } finally {
      rmSync(diagnosticsDir, { recursive: true, force: true })
    }
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

describe('NodeDriver writeDesignSystemLib', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  function createLibProject(extraConfig = ''): string {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-driver-lib-')))
    const config = extraConfig ? CONFIG.replace('export default {', `export default {\n${extraConfig}`) : CONFIG

    writeFileTree(root, {
      'panda.config.ts': config,
      'package.json': JSON.stringify(
        { name: '@acme/ds', version: '1.2.3', peerDependencies: { '@pandacss/dev': '^2.0.0' } },
        null,
        2,
      ),
      'button.tsx': "import { css } from '@panda/css'; css({ color: 'red' })",
    })

    return root
  }

  it('writes design-system lib artifacts and syncs package exports', async () => {
    dir = createLibProject()

    const driver = await createNodeDriver({ cwd: dir })
    const result = await driver.writeDesignSystemLib()

    expect(result).toMatchObject({
      manifestPath: join(dir, 'dist', 'panda', 'lib.json'),
      buildInfoPath: join(dir, 'dist', 'panda', 'buildinfo.json'),
      presetPath: join(dir, 'dist', 'panda', 'preset.mjs'),
      exportsChanged: true,
      parsedFileCount: 1,
      diagnostics: [],
    })

    const manifest = JSON.parse(readFileSync(join(dir, 'dist', 'panda', 'lib.json'), 'utf8'))
    expect(manifest).toMatchInlineSnapshot(`
      {
        "schemaVersion": 1,
        "name": "@acme/ds",
        "version": "1.2.3",
        "panda": "^2.0.0",
        "preset": "./preset.mjs",
        "buildInfo": "./buildinfo.json",
        "importMap": {
          "css": "@acme/ds/css",
          "recipes": "@acme/ds/recipes",
          "patterns": "@acme/ds/patterns",
          "jsx": "@acme/ds/jsx",
          "tokens": "@acme/ds/tokens",
        },
        "files": [
          "../button.tsx",
        ],
      }
    `)

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.exports).toMatchInlineSnapshot(`
      {
        "./panda/*": "./dist/panda/*",
      }
    `)
  })

  it('exports ./css/* and ./helpers when codegen emitted them', async () => {
    dir = createLibProject()

    const driver = await createNodeDriver({ cwd: dir })
    driver.codegen()
    await driver.writeDesignSystemLib()

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(Object.keys(pkg.exports)).toEqual(
      expect.arrayContaining(['./css', './css/*', './helpers', './patterns', './patterns/*', './tokens']),
    )
  })

  it('preserves an existing string root export', async () => {
    dir = createLibProject()
    writeFileTree(dir, {
      'package.json': JSON.stringify({ name: '@acme/ds', version: '1.2.3', exports: './dist/index.js' }, null, 2),
    })

    const driver = await createNodeDriver({ cwd: dir })
    await driver.writeDesignSystemLib()

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.exports).toMatchInlineSnapshot(`
      {
        ".": "./dist/index.js",
        "./panda/*": "./dist/panda/*",
      }
    `)
  })

  it('omits inferred fallback files that package.json files would not publish', async () => {
    dir = createLibProject()
    writeFileTree(dir, {
      'package.json': JSON.stringify(
        {
          name: '@acme/ds',
          version: '1.2.3',
          files: ['dist'],
          peerDependencies: { '@pandacss/dev': '^2.0.0' },
        },
        null,
        2,
      ),
    })

    const driver = await createNodeDriver({ cwd: dir })
    const result = await driver.writeDesignSystemLib()

    const manifest = JSON.parse(readFileSync(join(dir, 'dist', 'panda', 'lib.json'), 'utf8'))
    expect(manifest.files).toBeUndefined()
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: 'design_system_files_not_publishable',
        severity: 'warning',
        category: 'designSystem',
      }),
    ])
    expect(result.diagnostics[0]?.message).toContain("panda lib --files './**/*.{js,mjs}'")
  })

  it('keeps explicit --files even when they sit outside package.json files', async () => {
    dir = createLibProject()
    writeFileTree(dir, {
      'package.json': JSON.stringify(
        {
          name: '@acme/ds',
          version: '1.2.3',
          files: ['dist'],
          peerDependencies: { '@pandacss/dev': '^2.0.0' },
        },
        null,
        2,
      ),
    })

    const driver = await createNodeDriver({ cwd: dir })
    const result = await driver.writeDesignSystemLib({ files: ['./**/*.{js,mjs}'] })

    const manifest = JSON.parse(readFileSync(join(dir, 'dist', 'panda', 'lib.json'), 'utf8'))
    expect(manifest.files).toEqual(['./**/*.{js,mjs}'])
    expect(result.diagnostics.filter((d) => d.code === 'design_system_files_not_publishable')).toEqual([])
  })

  it('does not publish hydrated parent build info as fallback files', async () => {
    dir = createLibProject("  designSystem: '@acme/foundations',")

    const parent = createProject()
    parent.parseFileSource('surface.tsx', "import { css } from '@panda/css'; css({ color: 'teal' })")

    writeFileTree(dir, {
      'node_modules/@acme/foundations/package.json': JSON.stringify({
        name: '@acme/foundations',
        version: '1.0.0',
        exports: { './panda/*': './panda/*' },
      }),
      'node_modules/@acme/foundations/panda/lib.json': JSON.stringify({
        schemaVersion: 1,
        name: '@acme/foundations',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './buildinfo.json',
        importMap: { css: '@acme/foundations/css' },
      }),
      'node_modules/@acme/foundations/panda/preset.mjs': 'export default { name: "@acme/foundations" }',
      'node_modules/@acme/foundations/panda/buildinfo.json': JSON.stringify(
        parent.buildInfo.create({ panda: '^2.0.0' }),
      ),
    })

    const driver = await createNodeDriver({ cwd: dir })
    await driver.writeDesignSystemLib()

    const manifest = JSON.parse(readFileSync(join(dir, 'dist', 'panda', 'lib.json'), 'utf8'))
    expect(manifest).toMatchInlineSnapshot(`
      {
        "schemaVersion": 1,
        "name": "@acme/ds",
        "version": "1.2.3",
        "panda": "^2.0.0",
        "preset": "./preset.mjs",
        "buildInfo": "./buildinfo.json",
        "importMap": {
          "css": "@acme/ds/css",
          "recipes": "@acme/ds/recipes",
          "patterns": "@acme/ds/patterns",
          "jsx": "@acme/ds/jsx",
          "tokens": "@acme/ds/tokens",
        },
        "designSystem": "@acme/foundations",
        "files": [
          "../button.tsx",
        ],
      }
    `)
  })

  it('does not write artifacts when diagnostics fail the warning budget', async () => {
    dir = createLibProject()
    writeFileTree(dir, {
      'button.tsx': "import { css } from '@panda/css'; css({ color: })",
    })

    const driver = await createNodeDriver({ cwd: dir })
    const result = await driver.writeDesignSystemLib({ maxWarnings: 0 })

    expect(result.diagnostics.length).toBeGreaterThan(0)
    expect(existsSync(join(dir, 'dist', 'panda', 'lib.json'))).toBe(false)
    expect(existsSync(join(dir, 'dist', 'panda', 'buildinfo.json'))).toBe(false)
    expect(existsSync(join(dir, 'dist', 'panda', 'preset.mjs'))).toBe(false)
  })

  it('invalidates the compiled preset when config reloads', async () => {
    dir = createLibProject("  theme: { tokens: { colors: { brand: { value: 'red' } } } },")

    const driver = await createNodeDriver({ cwd: dir })
    await driver.writeDesignSystemLib()
    expect(readFileSync(join(dir, 'dist', 'panda', 'preset.mjs'), 'utf8')).toContain('red')

    writeFileTree(dir, {
      'panda.config.ts': CONFIG.replace(
        'export default {',
        "export default {\n  theme: { tokens: { colors: { brand: { value: 'blue' } } } },",
      ),
    })

    const diff = await driver.reload()
    expect(diff.hasChanged).toBe(true)

    await driver.writeDesignSystemLib()
    expect(readFileSync(join(dir, 'dist', 'panda', 'preset.mjs'), 'utf8')).toContain('blue')
  })
})

describe('createNodeDriver isConfigFile (symlinks)', () => {
  it('matches the config file through a symlinked cwd', async () => {
    const real = realpathSync(mkdtempSync(join(tmpdir(), 'panda-real-')))
    writeFileTree(real, {
      'panda.config.ts': CONFIG,
    })
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

describe('createNodeDriver designSystem', () => {
  it('loads a package manifest, hydrates build info, and tracks design-system dependencies', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-driver-ds-'))
    const pkg = join(dir, 'node_modules', '@acme', 'ds')

    const lib = createProject()
    lib.parseFileSource('button.tsx', "import { css } from '@panda/css'\nexport const Button = css({ color: 'red' })")

    writeFileTree(dir, {
      'panda.config.ts': "export default { designSystem: '@acme/ds', include: ['App.tsx'] }",
      'App.tsx': '',
      'node_modules/@acme/ds/package.json': JSON.stringify({
        name: '@acme/ds',
        version: '1.0.0',
        exports: { './panda/*': './panda/*' },
      }),
      'node_modules/@acme/ds/panda/lib.json': JSON.stringify({
        schemaVersion: 1,
        name: '@acme/ds',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './buildinfo.json',
        importMap: { css: '@acme/ds/css' },
      }),
      'node_modules/@acme/ds/panda/preset.mjs': 'export default { name: "@acme/ds" }',
      'node_modules/@acme/ds/panda/buildinfo.json': JSON.stringify(lib.buildInfo.create({ panda: '^2.0.0' })),
    })

    try {
      const driver = await createNodeDriver({ cwd: dir })
      const css = driver.cssgen().css
      const realPkg = realpathSync(pkg)

      expect(css).toContain('color: red')
      expect(driver.designSystemWatchTargets()).toMatchInlineSnapshot(`
        [
          {
            "name": "@acme/ds",
            "manifestPath": "${realPkg}/panda/lib.json",
            "buildInfoPath": "${realPkg}/panda/buildinfo.json",
            "presetPath": "${realPkg}/panda/preset.mjs",
            "sourceFiles": [],
          },
        ]
      `)
      expect(driver.isConfigFile(join(pkg, 'panda', 'lib.json'))).toBe(true)
      expect(driver.isConfigFile(join(pkg, 'panda', 'preset.mjs'))).toBe(true)
      expect(driver.isConfigFile(join(pkg, 'panda', 'buildinfo.json'))).toBe(true)
      expect(driver.isDesignSystemFile(join(pkg, 'panda', 'lib.json'))).toBe('artifact')
      expect(driver.isDesignSystemFile(join(pkg, 'panda', 'preset.mjs'))).toBe('artifact')
      expect(driver.isDesignSystemFile(join(pkg, 'panda', 'buildinfo.json'))).toBe('artifact')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('tracks design-system source files listed in the manifest', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-driver-ds-source-watch-'))
    const pkg = join(dir, 'node_modules', '@acme', 'ds')

    const lib = createProject()
    lib.parseFileSource(
      'src/button.tsx',
      "import { css } from '@panda/css'\nexport const Button = css({ color: 'red' })",
    )

    writeFileTree(dir, {
      'panda.config.ts': "export default { designSystem: '@acme/ds', include: ['App.tsx'] }",
      'App.tsx': '',
      'node_modules/@acme/ds/package.json': JSON.stringify({
        name: '@acme/ds',
        version: '1.0.0',
        exports: { './panda/*': './panda/*' },
      }),
      'node_modules/@acme/ds/panda/lib.json': JSON.stringify({
        schemaVersion: 1,
        name: '@acme/ds',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './buildinfo.json',
        importMap: { css: '@acme/ds/css' },
        files: ['./src/**/*.tsx'],
      }),
      'node_modules/@acme/ds/panda/preset.mjs': 'export default { name: "@acme/ds" }',
      'node_modules/@acme/ds/panda/buildinfo.json': JSON.stringify(lib.buildInfo.create({ panda: '^2.0.0' })),
      'node_modules/@acme/ds/src/button.tsx':
        "import { css } from '@panda/css'\nexport const Button = css({ color: 'red' })",
    })

    try {
      const driver = await createNodeDriver({ cwd: dir })
      const source = realpathSync(join(pkg, 'src', 'button.tsx'))

      expect(driver.designSystemWatchTargets()[0]?.sourceFiles).toEqual([source])
      expect(driver.isDesignSystemFile(source)).toBe('source')

      writeFileTree(dir, {
        'node_modules/@acme/ds/src/button.tsx':
          "import { css } from '@panda/css'\nexport const Button = css({ color: 'blue' })",
      })
      expect(driver.syncDesignSystemSources()).toEqual([])
      expect(driver.cssgen().css).toContain('color: red')
      expect(driver.cssgen().css).not.toContain('color: blue')

      rmSync(source)
      expect(driver.isDesignSystemFile(source)).toBe('source')

      await expect(
        driver.syncDesignSystemFileChange({
          path: source,
          kind: 'change',
          content: "import { css } from '@acme/ds/css'\nexport const Button = css({ color: 'blue' })",
        }),
      ).resolves.toBe(true)
      expect(driver.cssgen().css).toContain('color: blue')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('reloads when design-system build info changes', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-driver-ds-reload-'))

    const first = createProject()
    first.parseFileSource('button.tsx', "import { css } from '@panda/css'\nexport const Button = css({ color: 'red' })")

    const second = createProject()
    second.parseFileSource(
      'button.tsx',
      "import { css } from '@panda/css'\nexport const Button = css({ color: 'blue' })",
    )

    writeFileTree(dir, {
      'panda.config.ts': "export default { designSystem: '@acme/ds', include: ['App.tsx'] }",
      'App.tsx': '',
      'node_modules/@acme/ds/package.json': JSON.stringify({
        name: '@acme/ds',
        version: '1.0.0',
        exports: { './panda/*': './panda/*' },
      }),
      'node_modules/@acme/ds/panda/lib.json': JSON.stringify({
        schemaVersion: 1,
        name: '@acme/ds',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './buildinfo.json',
        importMap: { css: '@acme/ds/css' },
      }),
      'node_modules/@acme/ds/panda/preset.mjs': 'export default { name: "@acme/ds" }',
      'node_modules/@acme/ds/panda/buildinfo.json': JSON.stringify(first.buildInfo.create({ panda: '^2.0.0' })),
    })

    try {
      const driver = await createNodeDriver({ cwd: dir })
      expect(driver.cssgen().css).toContain('color: red')

      writeFileTree(dir, {
        'node_modules/@acme/ds/panda/buildinfo.json': JSON.stringify(second.buildInfo.create({ panda: '^2.0.0' })),
      })

      const diff = await driver.reload()
      expect(diff.hasChanged).toBe(true)
      expect(driver.cssgen().css).toContain('color: blue')
      expect(driver.cssgen().css).not.toContain('color: red')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('syncs design-system artifact changes without dropping consumer source state', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-driver-ds-artifact-sync-'))

    const first = createProject()
    first.parseFileSource('button.tsx', "import { css } from '@panda/css'\nexport const Button = css({ color: 'red' })")

    const second = createProject()
    second.parseFileSource(
      'button.tsx',
      "import { css } from '@panda/css'\nexport const Button = css({ color: 'blue' })",
    )

    writeFileTree(dir, {
      'panda.config.ts':
        "export default { designSystem: '@acme/ds', include: ['App.tsx'], importMap: { css: ['@panda/css'] } }",
      'App.tsx': "import { css } from '@panda/css'\ncss({ color: 'green' })",
      'node_modules/@acme/ds/package.json': JSON.stringify({
        name: '@acme/ds',
        version: '1.0.0',
        exports: { './panda/*': './panda/*' },
      }),
      'node_modules/@acme/ds/panda/lib.json': JSON.stringify({
        schemaVersion: 1,
        name: '@acme/ds',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './buildinfo.json',
        importMap: { css: '@acme/ds/css' },
      }),
      'node_modules/@acme/ds/panda/preset.mjs': 'export default { name: "@acme/ds" }',
      'node_modules/@acme/ds/panda/buildinfo.json': JSON.stringify(first.buildInfo.create({ panda: '^2.0.0' })),
    })

    try {
      const driver = await createNodeDriver({ cwd: dir })
      driver.parseFiles()
      expect(driver.cssgen().css).toContain('color: green')

      const buildInfoPath = join(dir, 'node_modules', '@acme', 'ds', 'panda', 'buildinfo.json')
      writeFileTree(dir, {
        'node_modules/@acme/ds/panda/buildinfo.json': JSON.stringify(second.buildInfo.create({ panda: '^2.0.0' })),
      })

      await expect(driver.syncDesignSystemFileChange({ path: buildInfoPath, kind: 'change' })).resolves.toBe(true)
      const css = driver.cssgen().css
      expect(css).toContain('color: green')
      expect(css).toContain('color: blue')
      expect(css).not.toContain('color: red')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('fails clearly when the manifest build info cannot be read', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-driver-ds-missing-'))

    writeFileTree(dir, {
      'panda.config.ts': "export default { designSystem: '@acme/ds' }",
      'node_modules/@acme/ds/package.json': JSON.stringify({
        name: '@acme/ds',
        version: '1.0.0',
        exports: { './panda/*': './panda/*' },
      }),
      'node_modules/@acme/ds/panda/lib.json': JSON.stringify({
        schemaVersion: 1,
        name: '@acme/ds',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './missing.buildinfo.json',
      }),
      'node_modules/@acme/ds/panda/preset.mjs': 'export default { name: "@acme/ds" }',
    })

    try {
      await expect(captureDesignSystemError(createNodeDriver({ cwd: dir }))).resolves.toMatchInlineSnapshot(`
        {
          "diagnostics": [
            {
              "code": "design_system_buildinfo_stale",
              "help": [
                "Run \`panda lib\` in "@acme/ds" to rebuild panda/buildinfo.json.",
              ],
              "message": ""@acme/ds" build info could not be read: file not found. No fallback source files were available.",
              "severity": "error",
            },
          ],
          "message": ""@acme/ds" build info could not be read: file not found. No fallback source files were available.",
        }
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('fails clearly when the manifest schema is incompatible', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-driver-ds-schema-'))

    const lib = createProject()

    writeFileTree(dir, {
      'panda.config.ts': "export default { designSystem: '@acme/ds' }",
      'node_modules/@acme/ds/package.json': JSON.stringify({
        name: '@acme/ds',
        version: '1.0.0',
        exports: { './panda/*': './panda/*' },
      }),
      'node_modules/@acme/ds/panda/lib.json': JSON.stringify({
        schemaVersion: 999,
        name: '@acme/ds',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './buildinfo.json',
      }),
      'node_modules/@acme/ds/panda/preset.mjs': 'export default { name: "@acme/ds" }',
      'node_modules/@acme/ds/panda/buildinfo.json': JSON.stringify(lib.buildInfo.create({ panda: '^2.0.0' })),
    })

    try {
      await expect(captureDesignSystemError(createNodeDriver({ cwd: dir }))).resolves.toMatchInlineSnapshot(`
        {
          "diagnostics": [
            {
              "code": "design_system_version_mismatch",
              "help": [
                "Upgrade "@acme/ds", or rebuild it with a compatible version of Panda.",
              ],
              "message": ""@acme/ds" panda/lib.json uses schemaVersion 999; expected 1.",
              "severity": "error",
            },
          ],
          "message": ""@acme/ds" panda/lib.json uses schemaVersion 999; expected 1.",
        }
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('fails clearly when the manifest Panda range is incompatible', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-driver-ds-range-'))

    const lib = createProject()

    writeFileTree(dir, {
      'panda.config.ts': "export default { designSystem: '@acme/ds' }",
      'node_modules/@acme/ds/package.json': JSON.stringify({
        name: '@acme/ds',
        version: '1.0.0',
        exports: { './panda/*': './panda/*' },
      }),
      'node_modules/@acme/ds/panda/lib.json': JSON.stringify({
        schemaVersion: 1,
        name: '@acme/ds',
        panda: '^999.0.0',
        preset: './preset.mjs',
        buildInfo: './buildinfo.json',
      }),
      'node_modules/@acme/ds/panda/preset.mjs': 'export default { name: "@acme/ds" }',
      'node_modules/@acme/ds/panda/buildinfo.json': JSON.stringify(lib.buildInfo.create({ panda: '^2.0.0' })),
    })

    try {
      await expect(captureDesignSystemError(createNodeDriver({ cwd: dir }))).resolves.toMatchInlineSnapshot(`
        {
          "diagnostics": [
            {
              "code": "design_system_peer_range_unsatisfied",
              "help": [
                "Install a compatible Panda version or update "@acme/ds".",
              ],
              "message": ""@acme/ds" requires Panda ^999.0.0; the consumer uses <version>.",
              "severity": "error",
            },
          ],
          "message": ""@acme/ds" requires Panda ^999.0.0; the consumer uses <version>.",
        }
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('createNodeDriver reload', () => {
  let dir: string

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'panda-driver-reload-'))
    writeFileTree(dir, {
      'panda.config.ts': CONFIG,
    })
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns a non-empty diff after a config edit', async () => {
    const driver = await createNodeDriver({ cwd: dir })

    writeFileTree(dir, {
      'panda.config.ts': CONFIG.replace("defaultValues: { gap: '4' }", "defaultValues: { gap: '8' }"),
    })
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
