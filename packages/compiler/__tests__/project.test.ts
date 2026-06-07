import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compile, createCompiler } from '../src'
import { createProject, createUserConfig, importMap } from './test-utils'

describe('Compiler', () => {
  it('extracts atoms from a css() call', () => {
    const compiler = createProject()
    compiler.parseFileSource(
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
    compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ color: 'red', bg: 'blue' })`,
    )
    expect(compiler.compile()).toMatchInlineSnapshot(`
      {
        "css": "@layer reset, base, tokens, recipes, utilities;
      @layer base {
        :root {
          --made-with-panda: '🐼';
        }
      }
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
          "base": {
            "start": 48,
            "end": 109,
          },
          "utilities": {
            "start": 109,
            "end": 206,
          },
        },
        "diagnostics": [],
      }
    `)
  })

  it('can compile without the layer order declaration', () => {
    const compiler = createProject({
      utilities: {
        color: { className: 'c' },
      },
    })
    compiler.parseFileSource('/virtual/Button.tsx', `import { css } from '@panda/css'; css({ color: 'red' })`)

    const output = compiler.compile({ emitLayerDeclaration: false })

    expect(output.css).not.toContain('@layer reset, base, tokens, recipes, utilities;')
    expect(output.css).toContain('@layer utilities')
    // The base layer precedes utilities; layerRanges are byte offsets (not UTF-16).
    const utilitiesByteStart = Buffer.byteLength(output.css.slice(0, output.css.indexOf('@layer utilities')))
    expect(output.layerRanges.utilities?.start).toBe(utilitiesByteStart)
  })

  it('generates codegen artifacts from the resolved project', () => {
    const compiler = createProject({
      theme: {
        tokens: {
          colors: {
            red: { 500: { value: '#f00' } },
          },
        },
      },
      utilities: {
        color: { className: 'c', values: 'colors' },
      },
    })
    const artifact = compiler.generateArtifact('types')

    expect(artifact?.files.map((file) => file.path)).toMatchInlineSnapshot(`
      [
        "types/tokens.d.mts",
        "types/system.d.mts",
        "types/pattern.d.mts",
        "types/recipe.d.mts",
        "types/index.d.mts",
      ]
    `)
    expect(artifact?.files.find((file) => file.path === 'types/tokens.d.mts')?.code).toMatchInlineSnapshot(`
      "export type ColorToken = "colorPalette.500" | "red.500"

      export interface Tokens {
        colors: ColorToken
      }

      export type Token = \`colors.\${ColorToken}\`

      export type ColorOpacityModifier = \`\${number}\`

      export type ColorOpacityToken = \`colors.\${ColorToken}/\${ColorOpacityModifier}\`

      export type TokenPath = Token | ColorOpacityToken

      export type ColorPalette = "red"

      export type TokenValue<T extends keyof Tokens> = Tokens[T]"
    `)
  })

  it('generates affected codegen artifacts from dependency names', () => {
    const compiler = createProject()

    expect(compiler.generateAffectedArtifacts(['tokens']).map((artifact) => artifact.id)).toMatchInlineSnapshot(`
      [
        "patterns",
        "themes",
        "types",
        "tokens",
        "conditions",
      ]
    `)
  })

  it('uses config codegenImportExtensions for generated import specifiers', () => {
    const compiler = createProject({ codegenImportExtensions: true })

    const artifact = compiler.generateArtifact('css-index')
    const runtime = artifact?.files.find((file) => file.path === 'css/index.mjs')?.code
    const types = artifact?.files.find((file) => file.path === 'css/index.d.mts')?.code

    expect(runtime).toContain('./css.mjs')
    expect(types).toContain('./css.d.mts')
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
      @layer base {
        :root {
          --made-with-panda: '🐼';
        }
      }
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
    compiler.parseFileSource('/virtual/A.tsx', "import { css } from '@panda/css'; css({ color: 'red' })")
    compiler.parseFileSource('/virtual/B.tsx', "import { css } from '@panda/css'; css({ color: 'blue' })")
    const manifest = compiler.fileManifest()
    expect(manifest.map((entry) => entry.path)).toEqual(['/virtual/A.tsx', '/virtual/B.tsx'])
    expect(manifest.every((entry) => /^[0-9a-f]{16}$/.test(entry.hash))).toBe(true)
  })

  it('returns a per-file ParsedFileView via getFile()', () => {
    const compiler = createProject()
    compiler.parseFileSource('/virtual/A.tsx', "import { css } from '@panda/css'; css({ color: 'red', bg: 'blue' })")
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
    compiler.parseFileSource('/virtual/A.tsx', "import { css } from '@panda/css'; css({ color: 'red' })")
    const output = compiler.compile()
    const utilities = output.layerRanges.utilities
    expect(utilities).toBeDefined()
    expect(output.css.slice(utilities!.start, utilities!.end)).toMatchInlineSnapshot(`
      "ayer utilities {
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
      @layer base {
        :root {
          --made-with-panda: '🐼';
        }
      }
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

  it('one-shot compile() surfaces file parse diagnostics', () => {
    const output = compile({
      config: createUserConfig() as unknown as Record<string, unknown>,
      files: [
        {
          path: '/virtual/App.tsx',
          content: "import { css } from '@panda/css'\ncss({ color: })",
        },
      ],
    })

    expect(output.diagnostics.map(({ severity }) => ({ severity }))).toMatchInlineSnapshot(`
      [
        {
          "severity": "error",
        },
      ]
    `)
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
    compiler.parseFileSource(
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

    const report = compiler.parseFileSource(
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
    compiler.parseFileSource(
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
    compiler.parseFileSource(
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

  it('extracts JSX factory call base styles into CSS', () => {
    const compiler = createProject({
      jsxFactory: 'panda',
    })

    compiler.parseFileSource(
      '/Notice.tsx',
      `import { panda } from '@panda/jsx'
       const Notice = panda('div', {
         base: {
           fontFamily: 'Monaspace Neon',
           background: 'pink',
           paddingInline: '16px',
           paddingBlock: '16px',
         },
       })`,
    )

    expect(compiler.compile().css).toMatchInlineSnapshot(`
      "@layer reset, base, tokens, recipes, utilities;
      @layer base {
        :root {
          --made-with-panda: '🐼';
        }
      }
      @layer utilities {
        .background_pink {
          background: pink;
        }
        .padding-inline_16px {
          padding-inline: 16px;
        }
        .padding-block_16px {
          padding-block: 16px;
        }
        .font-family_Monaspace_Neon {
          font-family: Monaspace Neon;
        }
      }
      "
    `)
  })

  it('extracts JSX factory recipe variants into CSS', () => {
    const compiler = createProject({
      jsxFactory: 'panda',
    })

    compiler.parseFileSource(
      '/Notice.tsx',
      `import { panda } from '@panda/jsx'
       const Notice = panda('div', {
         base: { display: 'inline-flex' },
         variants: {
           size: {
             sm: { fontSize: '12px' },
             lg: { fontSize: '18px' },
           },
           tone: {
             info: { color: 'blue' },
             danger: { color: 'red' },
           },
         },
         defaultVariants: {
           size: 'sm',
           tone: 'info',
         },
         compoundVariants: [
           {
             size: 'lg',
             tone: 'danger',
             css: { fontWeight: 'bold' },
           },
         ],
       })`,
    )

    expect(compiler.compile().css).toMatchInlineSnapshot(`
      "@layer reset, base, tokens, recipes, utilities;
      @layer base {
        :root {
          --made-with-panda: '🐼';
        }
      }
      @layer utilities {
        .color_blue {
          color: blue;
        }
        .color_red {
          color: red;
        }
        .display_inline-flex {
          display: inline-flex;
        }
        .font-size_12px {
          font-size: 12px;
        }
        .font-size_18px {
          font-size: 18px;
        }
        .font-weight_bold {
          font-weight: bold;
        }
      }
      "
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
      compiler.parseFileSource(
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
    const report = compiler.parseFileSource(
      '/mixed.tsx',
      `import { css, cva } from '@panda/css'
       import { Box } from '@panda/jsx'
       css({ color: 'red' })
       const r = cva({ base: { p: 1 } })
       const X = () => <Box bg="blue" />`,
    )
    expect(report).toMatchInlineSnapshot(`
      {
        "path": "/mixed.tsx",
        "cssCalls": 1,
        "cvaCalls": 1,
        "svaCalls": 0,
        "jsxUsages": 1,
        "diagnostics": [],
      }
    `)
  })

  it('project compile() includes parse diagnostics from files', () => {
    const compiler = createProject()
    compiler.parseFileSource('/bad.tsx', "import { css } from '@panda/css'\ncss({ color: })")

    expect(compiler.compile().diagnostics.map(({ severity }) => ({ severity }))).toMatchInlineSnapshot(`
      [
        {
          "severity": "error",
        },
      ]
    `)
  })
})
