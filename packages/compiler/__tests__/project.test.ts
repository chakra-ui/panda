import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compile, createCompiler } from '../src'
import { createProject, createUserConfig, importMap } from './test-utils'

describe('Compiler', () => {
  it('extracts atoms from a css() call', () => {
    const compiler = createProject()
    compiler.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ color: 'red', bg: 'blue' })`,
    )
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "bg",
          "value": "blue",
          "conditions": [],
        },
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
      ]
    `)
  })

  it('compiles parsed atoms to layered css', () => {
    const compiler = createProject({
      utilities: {
        color: { className: 'c' },
        backgroundColor: { className: 'bg', shorthand: 'bg' },
      },
    })
    compiler.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ color: 'red', bg: 'blue' })`,
    )
    expect(compiler.compile()).toMatchInlineSnapshot(`
      {
        "css": "@layer reset, base, tokens, recipes, utilities;
      @layer utilities {
        .bg_blue {
          background-color: blue;
        }
        .c_red {
          color: red;
        }
      }
      ",
        "manifest": {
          "files": [
            {
              "path": "/virtual/Button.tsx",
              "hash": "659fa58fc04d3693",
            },
          ],
          "tokens": [],
        },
        "layerRanges": {
          "utilities": {
            "start": 48,
            "end": 145,
          },
        },
        "diagnostics": [],
      }
    `)
  })

  it('expands staticCss.patterns through compile()', () => {
    const compiler = createProject({
      patterns: {
        flex: {
          properties: { display: { type: 'enum', value: ['flex'] } },
        },
      },
      staticCss: {
        patterns: { flex: [{ properties: { display: ['flex'] } }] },
      },
    })
    expect(compiler.compile().css).toMatchInlineSnapshot(`
      "@layer reset, base, tokens, recipes, utilities;
      @layer utilities {
        .display_flex {
          display: flex;
        }
      }
      "
    `)
  })

  it('includes config validation diagnostics in compile output', () => {
    const compiler = createProject({
      conditions: {
        pinkTheme: '[data-theme=pink]',
      },
    })

    expect(compiler.compile().diagnostics).toMatchInlineSnapshot(`
      [
        {
          "code": "config_condition_selector_invalid",
          "message": "Selectors should contain the \`&\` character: \`[data-theme=pink]\`",
          "severity": "warning",
        },
      ]
    `)
  })

  it('exposes config validation diagnostics standalone via diagnostics()', () => {
    const compiler = createProject({
      conditions: { pinkTheme: '[data-theme=pink]' },
    })
    expect(compiler.diagnostics()).toMatchInlineSnapshot(`
      [
        {
          "code": "config_condition_selector_invalid",
          "message": "Selectors should contain the \`&\` character: \`[data-theme=pink]\`",
          "severity": "warning",
        },
      ]
    `)
  })

  it('lists parsed files via fileManifest()', () => {
    const compiler = createProject()
    compiler.parseFile('/virtual/A.tsx', "import { css } from '@panda/css'; css({ color: 'red' })")
    compiler.parseFile('/virtual/B.tsx', "import { css } from '@panda/css'; css({ color: 'blue' })")
    const manifest = compiler.fileManifest()
    expect(manifest.map((entry) => entry.path)).toEqual(['/virtual/A.tsx', '/virtual/B.tsx'])
    expect(manifest.every((entry) => /^[0-9a-f]{16}$/.test(entry.hash))).toBe(true)
  })

  it('returns a per-file ParsedFileView via getFile()', () => {
    const compiler = createProject()
    compiler.parseFile('/virtual/A.tsx', "import { css } from '@panda/css'; css({ color: 'red', bg: 'blue' })")
    expect(compiler.getFile('/virtual/missing.tsx')).toBeNull()
    const view = compiler.getFile('/virtual/A.tsx')
    expect(view?.path).toBe('/virtual/A.tsx')
    expect(view?.atoms).toMatchInlineSnapshot(`
      [
        {
          "prop": "bg",
          "value": "blue",
          "conditions": [],
        },
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
      ]
    `)
  })

  it('exposes static pattern atoms standalone via staticPatternAtoms()', () => {
    const compiler = createProject({
      patterns: {
        flex: { properties: { display: { type: 'enum', value: ['flex'] } } },
      },
      staticCss: {
        patterns: { flex: [{ properties: { display: ['flex'] } }] },
      },
    })
    const result = compiler.staticPatternAtoms()
    expect(result.diagnostics).toEqual([])
    expect(result.atoms).toMatchInlineSnapshot(`
      [
        {
          "prop": "display",
          "value": "flex",
          "conditions": [],
        },
      ]
    `)
  })

  it('returns layer byte ranges in compile output', () => {
    const compiler = createProject()
    compiler.parseFile('/virtual/A.tsx', "import { css } from '@panda/css'; css({ color: 'red' })")
    const output = compiler.compile()
    const utilities = output.layerRanges.utilities
    expect(utilities).toBeDefined()
    expect(output.css.slice(utilities!.start, utilities!.end)).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  it('runs a one-shot compile() over a file set + config', () => {
    const output = compile({
      config: createUserConfig() as unknown as Record<string, unknown>,
      files: [
        {
          path: '/virtual/App.tsx',
          content: "import { css } from '@panda/css'; css({ color: 'red' })",
        },
      ],
    })
    expect(output.css).toMatchInlineSnapshot(`
      "@layer reset, base, tokens, recipes, utilities;
      @layer utilities {
        .color_red {
          color: red;
        }
      }
      "
    `)
    expect(output.manifest.files[0]?.path).toBe('/virtual/App.tsx')
    expect(output.diagnostics).toEqual([])
  })

  it('top-level compile() with no config surfaces an error diagnostic', () => {
    const output = compile()
    expect(output.css).toBe('')
    expect(output.diagnostics).toMatchInlineSnapshot(`
      [
        {
          "code": "compile_placeholder",
          "message": "compile() requires a \`config\`",
          "severity": "error",
        },
      ]
    `)
  })

  it('constructs from a serialized config snapshot', () => {
    const compiler = createCompiler(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap,
        jsxFactory: 'styled',
      },
      { crossFile: false },
    )

    expect(compiler.config()).toMatchObject({
      cwd: '/virtual',
      outdir: 'styled-system',
    })
    expect(compiler.isEmpty()).toBe(true)
    compiler.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ color: 'red' })`,
    )
    expect(compiler.isEmpty()).toBe(false)
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
      ]
    `)
  })

  it('keeps component props when jsx style props are disabled', () => {
    const compiler = createCompiler(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap,
        jsxStyleProps: 'none',
        patterns: {
          stack: {
            properties: {
              gap: {},
            },
          },
        },
      },
      { crossFile: false },
    )

    const report = compiler.parseFile(
      '/virtual/Stack.tsx',
      `import { Stack } from '@panda/jsx'
       const el = <Stack gap="4" color="red" css={{ margin: "8px" }} />`,
    )

    expect(report.jsxUsages).toBe(1)
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "gap",
          "value": "4",
          "conditions": [],
        },
      ]
    `)
  })

  it('decomposes nested conditions into condition chains', () => {
    const compiler = createCompiler(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap,
        conditions: {
          hover: '&:hover',
        },
        theme: {
          breakpoints: {
            md: '768px',
          },
        },
      },
      { crossFile: false },
    )
    compiler.parseFile(
      '/virtual/Card.tsx',
      `import { css } from '@panda/css'
       css({ color: 'red', _hover: { color: 'blue', md: { color: 'green' } } })`,
    )
    const atoms = compiler.atoms()
    const colorAtoms = atoms.filter((a) => a.prop === 'color')
    expect(colorAtoms).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
        {
          "prop": "color",
          "value": "blue",
          "conditions": [
            "_hover",
          ],
        },
        {
          "prop": "color",
          "value": "green",
          "conditions": [
            "_hover",
            "md",
          ],
        },
      ]
    `)
  })

  it('extracts JSX attributes as atoms', () => {
    const compiler = createProject()
    compiler.parseFile(
      '/Card.tsx',
      `import { Box } from '@panda/jsx'
       const X = () => <Box color="red" padding="4" />`,
    )
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
        {
          "prop": "padding",
          "value": "4",
          "conditions": [],
        },
      ]
    `)
  })

  it('cross-file folding resolves imported tokens (uses real fs)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-project-test-'))
    try {
      writeFileSync(join(dir, 'tokens.ts'), `export const brand = '#ef4444'\n`)
      const mainPath = join(dir, 'main.tsx')
      writeFileSync(
        mainPath,
        `import { brand } from './tokens'
         import { css } from '@panda/css'
         css({ color: brand })`,
      )

      const compiler = createProject({}, { crossFile: true })
      compiler.parseFile(
        mainPath,
        `import { brand } from './tokens'
         import { css } from '@panda/css'
         css({ color: brand })`,
      )
      expect(compiler.atoms()).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "#ef4444",
            "conditions": [],
          },
        ]
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('parseFile reports per-call counts', () => {
    const compiler = createProject()
    const report = compiler.parseFile(
      '/mixed.tsx',
      `import { css, cva } from '@panda/css'
       import { Box } from '@panda/jsx'
       css({ color: 'red' })
       const r = cva({ base: { p: 1 } })
       const X = () => <Box bg="blue" />`,
    )
    expect(report).toMatchInlineSnapshot(`
      {
        "cssCalls": 1,
        "cvaCalls": 1,
        "svaCalls": 0,
        "jsxUsages": 1,
        "diagnostics": [],
      }
    `)
  })
})
