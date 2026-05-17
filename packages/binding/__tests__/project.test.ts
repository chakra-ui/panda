import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Project, type Matchers } from '../src'

const matchers: Matchers = {
  css: { modules: ['@panda/css'], names: ['css', 'cva', 'sva'] },
  recipe: { modules: ['@panda/recipes'] },
  pattern: { modules: ['@panda/patterns'] },
  jsx: { modules: ['@panda/jsx'], names: ['styled', 'Box'] },
  tokens: { modules: ['@panda/tokens'], names: ['token'] },
}

describe('Project', () => {
  it('extracts atoms from a css() call', () => {
    const project = new Project(matchers, { crossFile: false })
    project.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ color: 'red', bg: 'blue' })`,
    )
    expect(project.atoms()).toMatchInlineSnapshot(`
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

  it('constructs from a serialized config snapshot', () => {
    const project = Project.fromConfig(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap: {
          css: ['@panda/css'],
          recipe: ['@panda/recipes'],
          pattern: ['@panda/patterns'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
        jsxFactory: 'styled',
      },
      { crossFile: false },
    )

    expect(project.config()).toMatchObject({
      cwd: '/virtual',
      outdir: 'styled-system',
    })
    expect(project.isEmpty()).toBe(true)
    project.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ color: 'red' })`,
    )
    expect(project.isEmpty()).toBe(false)
    expect(project.atoms()).toMatchInlineSnapshot(`
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
    const project = Project.fromConfig(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap: {
          css: ['@panda/css'],
          recipe: ['@panda/recipes'],
          pattern: ['@panda/patterns'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
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

    const report = project.parseFile(
      '/virtual/Stack.tsx',
      `import { Stack } from '@panda/jsx'
       const el = <Stack gap="4" color="red" css={{ margin: "8px" }} />`,
    )

    expect(report.jsxUsages).toBe(1)
    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "gap",
          "value": "4",
          "conditions": [],
        },
      ]
    `)
  })

  it('applies js-backed utility transform callbacks from a config bundle', () => {
    const project = Project.fromConfig(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => ({
              width: value,
              height: value,
            }),
          },
        },
      },
      { crossFile: false },
    )

    project.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ size: '4px', color: 'red' })`,
    )

    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
        {
          "prop": "height",
          "value": "4px",
          "conditions": [],
        },
        {
          "prop": "width",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('passes token helpers to utility transform callbacks', () => {
    const project = Project.fromConfig(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          utilities: {
            tint: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.tint.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.tint.transform': (value: string, args: any) => {
              const mix = args.utils.colorMix(value)
              return {
                color: args.token('colors.red.500'),
                opacity: args.token.raw('opacity.50')?.value,
                backgroundColor: mix.value,
                '--raw': args.raw,
              }
            },
          },
        },
      },
      {
        crossFile: false,
        tokenDictionary: {
          values: {
            'colors.red.500': '#f00',
            'opacity.50': '0.5',
          },
          vars: {
            'colors.red.500': 'var(--colors-red-500)',
          },
        },
      },
    )

    project.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ tint: 'red.500/50' })`,
    )

    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "--raw",
          "value": "red.500/50",
          "conditions": [],
        },
        {
          "prop": "backgroundColor",
          "value": "color-mix(in srgb, var(--colors-red-500) 50%, transparent)",
          "conditions": [],
        },
        {
          "prop": "color",
          "value": "var(--colors-red-500)",
          "conditions": [],
        },
        {
          "prop": "opacity",
          "value": "0.5",
          "conditions": [],
        },
      ]
    `)
  })

  it('resolves utility values callbacks from a config bundle', () => {
    const project = Project.fromConfig(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          utilities: {
            space: {
              values: {
                kind: 'js-callback',
                id: 'utilities.space.values',
              },
            },
          },
        },
        callbacks: {
          'utility.values': {
            'utilities.space.values': (theme: (category: string) => Record<string, string> | undefined) => ({
              ...(theme('spacing') ?? {}),
              compact: '2px',
            }),
          },
        },
      },
      {
        crossFile: false,
        tokenDictionary: {
          values: {
            'spacing.4': '1rem',
          },
          vars: {},
        },
      },
    )

    project.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ space: '4', _hover: { space: 'compact' } })`,
    )

    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "space",
          "value": "1rem",
          "conditions": [],
        },
        {
          "prop": "space",
          "value": "2px",
          "conditions": [
            "_hover",
          ],
        },
      ]
    `)
  })

  it('throws when serialized callback refs are missing callbacks', () => {
    expect(() =>
      Project.fromConfig(
        {
          config: {
            cwd: '/virtual',
            outdir: 'styled-system',
            importMap: {
              css: ['@panda/css'],
              recipe: ['@panda/recipes'],
              pattern: ['@panda/patterns'],
              jsx: ['@panda/jsx'],
              tokens: ['@panda/tokens'],
            },
            utilities: {
              size: {
                transform: {
                  kind: 'js-callback',
                  id: 'utilities.size.transform',
                },
              },
            },
          },
          callbacks: {},
        },
        { crossFile: false },
      ),
    ).toThrow('Missing utility.transform callback `utilities.size.transform` for `size`')
  })

  it('applies utility transform callbacks under conditions', () => {
    const project = Project.fromConfig(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => ({
              width: value,
              height: value,
            }),
          },
        },
      },
      { crossFile: false },
    )

    project.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ _hover: { size: '4px' } })`,
    )

    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "height",
          "value": "4px",
          "conditions": [
            "_hover",
          ],
        },
        {
          "prop": "width",
          "value": "4px",
          "conditions": [
            "_hover",
          ],
        },
      ]
    `)
  })

  it('applies utility transform callbacks from JSX props', () => {
    const project = Project.fromConfig(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => ({
              width: value,
              height: value,
            }),
          },
        },
      },
      { crossFile: false },
    )

    project.parseFile(
      '/virtual/Card.tsx',
      `import { Box } from '@panda/jsx'
       const el = <Box size="4px" />`,
    )

    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "height",
          "value": "4px",
          "conditions": [],
        },
        {
          "prop": "width",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('caches utility transform callback results', () => {
    let calls = 0
    const project = Project.fromConfig(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => {
              calls += 1
              return { width: value, height: value }
            },
          },
        },
      },
      { crossFile: false },
    )

    project.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ size: '4px', _hover: { size: '4px' } })`,
    )

    project.atoms()
    project.atoms()
    expect(calls).toBe(1)
  })

  it('applies pattern transform callbacks before encoding', () => {
    const project = Project.fromConfig(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          theme: {
            breakpoints: {
              tablet: '768px',
            },
          },
          patterns: {
            stack: {
              properties: {
                gap: {},
              },
              transform: {
                kind: 'js-callback',
                id: 'patterns.stack.transform',
              },
            },
          },
        },
        callbacks: {
          'pattern.transform': {
            'patterns.stack.transform': (props: { gap?: string }) => ({
              display: 'flex',
              gap: props.gap,
              tablet: {
                gap: '8',
              },
            }),
          },
        },
      },
      { crossFile: false },
    )

    project.parseFile(
      '/virtual/Stack.tsx',
      `import { stack } from '@panda/patterns'
       import { Stack } from '@panda/jsx'
       stack({ gap: '4' })
       const el = <Stack gap="6" />`,
    )

    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "display",
          "value": "flex",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "4",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "6",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "8",
          "conditions": [
            "tablet",
          ],
        },
      ]
    `)
  })

  it('decomposes nested conditions into condition chains', () => {
    const project = new Project(matchers, { crossFile: false })
    project.parseFile(
      '/virtual/Card.tsx',
      `import { css } from '@panda/css'
       css({ color: 'red', _hover: { color: 'blue', md: { color: 'green' } } })`,
    )
    const atoms = project.atoms()
    // Three color atoms: base, _hover, _hover+md
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

  it('refresh and remove update the atom set', () => {
    const project = new Project(matchers, { crossFile: false })
    project.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
      ]
    `)

    // refresh a known file → replaces atoms.
    expect(project.refreshFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'blue' })`)).toBe(true)
    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "blue",
          "conditions": [],
        },
      ]
    `)

    // refresh an unknown file → no-op.
    expect(project.refreshFile('/unknown.tsx', `whatever`)).toBe(false)

    // remove → drops contribution.
    expect(project.removeFile('/a.tsx')).toBe(true)
    expect(project.removeFile('/a.tsx')).toBe(false)
    expect(project.atoms()).toEqual([])
    expect(project.summary().filesProcessed).toBe(0)
  })

  it('dedups atoms across files', () => {
    const project = new Project(matchers, { crossFile: false })
    project.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    project.parseFile('/b.tsx', `import { css } from '@panda/css'\ncss({ color: 'red', bg: 'blue' })`)
    project.parseFile('/c.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    // 2 distinct atoms (color:red, bg:blue) even though /a and /c repeat color:red.
    expect(project.atoms()).toMatchInlineSnapshot(`
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

  it('clear drops every file', () => {
    const project = new Project(matchers, { crossFile: false })
    project.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    project.parseFile('/b.tsx', `import { css } from '@panda/css'\ncss({ bg: 'blue' })`)
    expect(project.summary().filesProcessed).toBe(2)
    project.clear()
    expect(project.isEmpty()).toBe(true)
    expect(project.summary()).toMatchInlineSnapshot(`
      {
        "filesProcessed": 0,
        "atomCount": 0,
        "recipeCount": 0,
        "slotRecipeCount": 0,
      }
    `)
  })

  it('records cva recipes', () => {
    const project = new Project(matchers, { crossFile: false })
    project.parseFile(
      '/Button.tsx',
      `import { cva } from '@panda/css'
       export const button = cva({
         base: { fontWeight: 'bold' },
         variants: { size: { sm: { fontSize: 'sm' }, lg: { fontSize: 'lg' } } },
         defaultVariants: { size: 'sm' },
       })`,
    )
    const recipes = project.recipes()
    expect(recipes).toHaveLength(1)
    expect(recipes[0].file).toBe('/Button.tsx')
    expect(recipes[0].spanStart).toBeGreaterThan(0)
    expect(recipes[0].recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "fontWeight": "bold",
        },
        "variants": [
          {
            "name": "size",
            "options": [
              {
                "key": "sm",
                "style": {
                  "fontSize": "sm",
                },
              },
              {
                "key": "lg",
                "style": {
                  "fontSize": "lg",
                },
              },
            ],
          },
        ],
        "defaultVariants": [
          [
            "size",
            "sm",
          ],
        ],
      }
    `)
  })

  it('extracts JSX attributes as atoms', () => {
    const project = new Project(matchers, { crossFile: false })
    project.parseFile(
      '/Card.tsx',
      `import { Box } from '@panda/jsx'
       const X = () => <Box color="red" padding="4" />`,
    )
    expect(project.atoms()).toMatchInlineSnapshot(`
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

      // crossFile: true is the default; spell it out for clarity.
      const project = new Project(matchers, { crossFile: true })
      project.parseFile(
        mainPath,
        `import { brand } from './tokens'
         import { css } from '@panda/css'
         css({ color: brand })`,
      )
      expect(project.atoms()).toMatchInlineSnapshot(`
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
    const project = new Project(matchers, { crossFile: false })
    const report = project.parseFile(
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
