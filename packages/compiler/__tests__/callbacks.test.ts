import { describe, expect, it } from 'vitest'
import { createCompiler } from '../src'
import type { PatternHelpers } from '../src'
import { importMap } from './test-utils'

describe('Compiler callbacks', () => {
  it('applies js-backed utility transform callbacks from a config bundle', () => {
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
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

    compiler.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ size: '4px', color: 'red' })`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
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
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
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
          values: { 'colors.red.500': '#f00', 'opacity.50': '0.5' },
          vars: { 'colors.red.500': 'var(--colors-red-500)', 'opacity.50': 'var(--opacity-50)' },
        },
      },
    )

    compiler.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ tint: 'red.500/50' })`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
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

  it('applies utility transform callbacks to encoded config recipes', () => {
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
          theme: {
            recipes: {
              button: {
                base: { size: '4px' },
                variants: {
                  size: {
                    sm: { size: '8px' },
                  },
                },
              },
            },
            slotRecipes: {
              tabs: {
                slots: ['root'],
                variants: {
                  size: {
                    sm: { root: { size: '12px' } },
                  },
                },
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

    compiler.parseFile(
      '/virtual/recipes.ts',
      `import { button } from '@panda/recipes'
       import * as recipes from '@panda/recipes'
       button({ size: 'sm' })
       recipes.tabs({ size: 'sm' })`,
    )

    expect(compiler.atoms()).toEqual([])
    expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
      {
        "base": [
          {
            "recipe": "button",
            "slot": null,
            "className": "button",
            "entries": [
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
            ],
          },
        ],
        "variants": [
          {
            "recipe": "button",
            "slot": null,
            "className": "button--size_sm",
            "entries": [
              {
                "prop": "height",
                "value": "8px",
                "conditions": [],
              },
              {
                "prop": "width",
                "value": "8px",
                "conditions": [],
              },
            ],
          },
          {
            "recipe": "tabs",
            "slot": "root",
            "className": "tabs__root--size_sm",
            "entries": [
              {
                "prop": "height",
                "value": "12px",
                "conditions": [],
              },
              {
                "prop": "width",
                "value": "12px",
                "conditions": [],
              },
            ],
          },
        ],
        "atomic": [],
      }
    `)
  })

  it('resolves utility values callbacks from a config bundle', () => {
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          conditions: {
            _hover: '&:hover',
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
          values: { 'spacing.4': '1rem' },
          vars: { 'spacing.4': 'var(--spacing-4)' },
        },
      },
    )

    compiler.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ space: '4', _hover: { space: 'compact' } })`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
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
      createCompiler(
        {
          config: {
            cwd: '/virtual',
            outdir: 'styled-system',
            importMap,
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
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          conditions: {
            _hover: '&:hover',
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

    compiler.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ _hover: { size: '4px' } })`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
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
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
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

    compiler.parseFile(
      '/virtual/Card.tsx',
      `import { Box } from '@panda/jsx'
       const el = <Box size="4px" />`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
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
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
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

    compiler.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ size: '4px', _hover: { size: '4px' } })`,
    )

    compiler.atoms()
    compiler.atoms()
    expect(calls).toBe(1)
  })

  it('shares utility transform cache between atoms and encoded recipes', () => {
    let calls = 0
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
          theme: {
            recipes: {
              button: {
                base: { size: '4px' },
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

    compiler.parseFile(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       import { button } from '@panda/recipes'
       css({ size: '4px' })
       button()`,
    )

    compiler.atoms()
    compiler.encodedRecipes()
    expect(calls).toBe(1)
  })

  it('applies pattern transform callbacks before encoding', () => {
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          conditions: {
            _hover: '&:hover',
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
            'patterns.stack.transform': (props: { gap?: unknown }, helpers: PatternHelpers) => ({
              display: 'flex',
              gap: helpers.map(props.gap, (value) =>
                helpers.isCssUnit(value) || helpers.isCssVar(value) || helpers.isCssFunction(value)
                  ? value
                  : `token(spacing.${value}, ${value})`,
              ),
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFile(
      '/virtual/Stack.tsx',
      `import { stack } from '@panda/patterns'
       import { Stack } from '@panda/jsx'
       stack({ gap: { base: '4', _hover: '8px' } })
       const el = <Stack gap="var(--gap)" />`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "display",
          "value": "flex",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "token(spacing.4, 4)",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "var(--gap)",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "8px",
          "conditions": [
            "_hover",
          ],
        },
      ]
    `)
  })

  it('applies pattern transform callbacks from pattern function calls', () => {
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          conditions: {
            _hover: '&:hover',
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
            'patterns.stack.transform': (props: { gap?: unknown }) => ({
              display: 'flex',
              flexDirection: 'column',
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFile(
      '/virtual/Stack.ts',
      `import { stack } from '@panda/patterns'
       stack({ gap: { base: '4px', _hover: '8px' } })`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "display",
          "value": "flex",
          "conditions": [],
        },
        {
          "prop": "flexDirection",
          "value": "column",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "4px",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "8px",
          "conditions": [
            "_hover",
          ],
        },
      ]
    `)
  })

  it('applies pattern transform callbacks from JSX pattern components', () => {
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          patterns: {
            stack: {
              jsxName: 'Stack',
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
            'patterns.stack.transform': (props: { gap?: unknown }) => ({
              display: 'flex',
              flexDirection: 'column',
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFile(
      '/virtual/Stack.tsx',
      `import { Stack } from '@panda/jsx'
       const el = <Stack gap="4px" />`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "display",
          "value": "flex",
          "conditions": [],
        },
        {
          "prop": "flexDirection",
          "value": "column",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('caches pattern transform callback results across function calls and JSX components', () => {
    let calls = 0
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          patterns: {
            stack: {
              jsxName: 'Stack',
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
            'patterns.stack.transform': (props: { gap?: unknown }) => {
              calls += 1
              return {
                display: 'flex',
                gap: props.gap,
              }
            },
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFile(
      '/virtual/Stack.tsx',
      `import { stack } from '@panda/patterns'
       import { Stack } from '@panda/jsx'
       stack({ gap: '4px' })
       stack({ gap: '4px' })
       const el = <Stack gap="4px" />`,
    )

    expect(calls).toBe(1)
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "display",
          "value": "flex",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('does not cache thrown pattern transform callbacks', () => {
    let calls = 0
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
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
            'patterns.stack.transform': (props: { gap?: unknown }) => {
              calls += 1
              if (calls === 1) throw new Error('boom')
              return {
                display: 'flex',
                gap: props.gap,
              }
            },
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFile(
      '/virtual/Stack.ts',
      `import { stack } from '@panda/patterns'
       stack({ gap: '4px' })`,
    )
    compiler.parseFile(
      '/virtual/Stack.ts',
      `import { stack } from '@panda/patterns'
       stack({ gap: '4px' })`,
    )

    expect(calls).toBe(2)
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "display",
          "value": "flex",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('applies object defaultValues before pattern transform callbacks', () => {
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          patterns: {
            stack: {
              jsxName: 'Stack',
              properties: {
                gap: {},
              },
              defaultValues: {
                gap: '4px',
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
            'patterns.stack.transform': (props: { gap?: unknown }) => ({
              display: 'flex',
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFile(
      '/virtual/Stack.tsx',
      `import { stack } from '@panda/patterns'
       import { Stack } from '@panda/jsx'
       stack({})
       const el = <Stack />`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "display",
          "value": "flex",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('applies function defaultValues before pattern transform callbacks', () => {
    const compiler = createCompiler(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          patterns: {
            stack: {
              jsxName: 'Stack',
              properties: {
                gap: {},
              },
              defaultValues: {
                kind: 'js-callback',
                id: 'patterns.stack.defaultValues',
              },
              transform: {
                kind: 'js-callback',
                id: 'patterns.stack.transform',
              },
            },
          },
        },
        callbacks: {
          'pattern.defaultValues': {
            'patterns.stack.defaultValues': (props: { dense?: boolean }) => ({
              gap: props.dense ? '2px' : '4px',
            }),
          },
          'pattern.transform': {
            'patterns.stack.transform': (props: { gap?: unknown }) => ({
              display: 'flex',
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFile(
      '/virtual/Stack.tsx',
      `import { stack } from '@panda/patterns'
       import { Stack } from '@panda/jsx'
       stack({ dense: true })
       const el = <Stack gap="8px" />`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "display",
          "value": "flex",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "2px",
          "conditions": [],
        },
        {
          "prop": "gap",
          "value": "8px",
          "conditions": [],
        },
      ]
    `)
  })
})
