import { expect, it } from 'vitest'

import { createCompilerFromSnapshot, createCompilerFromWasmModule, loadWasm } from '../src'
import type { Atom } from '../src'
import { baseConfig, describeIfBuilt, describeMissingWasm } from './helpers'

describeIfBuilt('@pandacss/compiler-wasm callbacks', () => {
  it('applies utility transform callbacks in the JS host', async () => {
    const compiler = await createCompilerFromSnapshot({
      config: {
        ...baseConfig,
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
          'utilities.size.transform': (value) => ({
            width: value,
            height: value,
          }),
        },
      },
    })

    compiler.parseFileSource('/Button.tsx', `import { css } from '@panda/css'\ncss({ size: '4px', color: 'red' })`)

    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
        {
          "prop": "size",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('passes token helpers to utility transform callbacks', async () => {
    const compiler = await createCompilerFromSnapshot({
      config: {
        ...baseConfig,
        utilities: {
          tint: {
            transform: {
              kind: 'js-callback',
              id: 'utilities.tint.transform',
            },
          },
        },
        theme: {
          tokens: {
            colors: {
              red: {
                500: { value: '#f00' },
              },
            },
            opacity: {
              50: { value: '0.5' },
            },
          },
        },
      },
      callbacks: {
        'utility.transform': {
          'utilities.tint.transform': (value, args) => {
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
    })

    compiler.parseFileSource('/Button.tsx', `import { css } from '@panda/css'\ncss({ tint: 'red.500/50' })`)

    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
      [
        {
          "prop": "tint",
          "value": "red.500/50",
          "conditions": [],
        },
      ]
    `)
  })

  it('applies utility transform callbacks to encoded config recipes', async () => {
    const compiler = await createCompilerFromSnapshot({
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
          'utilities.size.transform': (value) => ({
            width: value,
            height: value,
          }),
        },
      },
    })

    compiler.parseFileSource(
      '/recipes.ts',
      `import { button } from '@panda/recipes'
         import * as recipes from '@panda/recipes'
         button({ size: 'sm' })
         recipes.tabs({ size: 'sm' })`,
    )

    expect(compiler.atoms() as Atom[]).toEqual([])
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

  it('resolves utility values callbacks in config-derived projects', async () => {
    const compiler = await createCompilerFromSnapshot({
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
        conditions: {
          hover: '&:hover',
        },
        utilities: {
          space: {
            values: {
              kind: 'js-callback',
              id: 'utilities.space.values',
            },
          },
        },
        theme: {
          tokens: {
            spacing: {
              4: { value: '1rem' },
            },
          },
        },
      },
      callbacks: {
        'utility.values': {
          'utilities.space.values': (theme) => ({
            ...(theme('spacing') ?? {}),
            compact: '2px',
          }),
        },
      },
    })

    compiler.parseFileSource(
      '/Button.tsx',
      `import { css } from '@panda/css'\ncss({ space: '4', _hover: { space: 'compact' } })`,
    )

    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
      [
        {
          "prop": "space",
          "value": 4,
          "conditions": [],
        },
        {
          "prop": "space",
          "value": "compact",
          "conditions": [
            "_hover",
          ],
        },
      ]
    `)
  })

  it('throws when serialized callback refs are missing callbacks', async () => {
    await expect(
      createCompilerFromSnapshot({
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
      }),
    ).rejects.toThrow('Missing utility.transform callback `utilities.size.transform` for `size`')
  })

  it('applies utility transform callbacks under conditions', async () => {
    const compiler = await createCompilerFromSnapshot({
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
        conditions: {
          hover: '&:hover',
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
          'utilities.size.transform': (value) => ({
            width: value,
            height: value,
          }),
        },
      },
    })

    compiler.parseFileSource('/Button.tsx', `import { css } from '@panda/css'\ncss({ _hover: { size: '4px' } })`)

    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
      [
        {
          "prop": "size",
          "value": "4px",
          "conditions": [
            "_hover",
          ],
        },
      ]
    `)
  })

  it('applies utility transform callbacks from JSX props', async () => {
    const compiler = await createCompilerFromSnapshot({
      config: {
        ...baseConfig,
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
          'utilities.size.transform': (value) => ({
            width: value,
            height: value,
          }),
        },
      },
    })

    compiler.parseFileSource('/Card.tsx', `import { Box } from '@panda/jsx'\nconst el = <Box size="4px" />`)

    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
      [
        {
          "prop": "size",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('caches utility transform callback results', async () => {
    let calls = 0
    const compiler = await createCompilerFromSnapshot({
      config: {
        ...baseConfig,
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
          'utilities.size.transform': (value) => {
            calls += 1
            return { width: value, height: value }
          },
        },
      },
    })

    compiler.parseFileSource(
      '/Button.tsx',
      `import { css } from '@panda/css'\ncss({ size: '4px', _hover: { size: '4px' } })`,
    )

    compiler.atoms()
    compiler.atoms()
    expect(calls).toBe(1)
  })

  it('reports utility transform callback failures during parseFile', async () => {
    const compiler = await createCompilerFromSnapshot({
      config: {
        ...baseConfig,
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
          'utilities.size.transform': () => {
            throw new Error('boom')
          },
        },
      },
    })

    const report = compiler.parseFileSource('/Button.tsx', `import { css } from '@panda/css'\ncss({ size: '4px' })`)

    expect(
      report.diagnostics.map((diagnostic: any) => ({
        message: diagnostic.message,
        severity: diagnostic.severity,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "message": "Utility transform callback \`utilities.size.transform\` for \`size\` threw: boom (utility \`size\` with value \`4px\`)",
          "severity": "warning",
        },
      ]
    `)
    expect(compiler.atoms()).toMatchInlineSnapshot(`[]`)
  })

  it('does not cache failed utility transform callbacks', async () => {
    let calls = 0
    const compiler = await createCompilerFromSnapshot({
      config: {
        ...baseConfig,
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
          'utilities.size.transform': (value) => {
            calls += 1
            if (calls === 1) throw new Error('boom')
            return { width: value, height: value }
          },
        },
      },
    })

    const source = `import { css } from '@panda/css'\ncss({ size: '4px' })`
    const failed = compiler.parseFileSource('/Button.tsx', source)
    const retried = compiler.parseFileSource('/Button.tsx', source)

    expect(
      failed.diagnostics.map((diagnostic: any) => ({
        message: diagnostic.message,
        severity: diagnostic.severity,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "message": "Utility transform callback \`utilities.size.transform\` for \`size\` threw: boom (utility \`size\` with value \`4px\`)",
          "severity": "warning",
        },
      ]
    `)
    expect(retried.diagnostics).toMatchInlineSnapshot(`[]`)
    expect(calls).toBe(2)
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "size",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('applies utility transform callbacks during refreshFile', async () => {
    const compiler = await createCompilerFromSnapshot({
      config: {
        ...baseConfig,
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
          'utilities.size.transform': (value) => ({ width: value, height: value }),
        },
      },
    })

    compiler.parseFileSource('/Button.tsx', `import { css } from '@panda/css'\ncss({ size: '4px' })`)
    expect(compiler.refreshFileSource('/Button.tsx', `import { css } from '@panda/css'\ncss({ size: '8px' })`)).toBe(
      true,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "size",
          "value": "4px",
          "conditions": [],
        },
        {
          "prop": "size",
          "value": "8px",
          "conditions": [],
        },
      ]
    `)
  })

  it('shares utility transform cache between atoms and encoded recipes', async () => {
    let calls = 0
    const compiler = await createCompilerFromSnapshot(
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
            'utilities.size.transform': (value) => {
              calls += 1
              return { width: value, height: value }
            },
          },
        },
      },
      {},
    )

    compiler.parseFileSource(
      '/Button.tsx',
      `import { css } from '@panda/css'
         import { button } from '@panda/recipes'
         css({ size: '4px' })
         button()`,
    )

    compiler.atoms()
    compiler.encodedRecipes()
    expect(calls).toBe(1)
  })

  it('applies pattern transform callbacks with helpers', async () => {
    const compiler = await createCompilerFromSnapshot({
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
        jsxFramework: 'react',
        conditions: {
          hover: '&:hover',
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
          'patterns.stack.transform': (props, helpers) => ({
            display: 'flex',
            gap: helpers.map(props.gap, (value) =>
              helpers.isCssUnit(value) || helpers.isCssVar(value) || helpers.isCssFunction(value)
                ? value
                : `token(spacing.${value}, ${value})`,
            ),
          }),
        },
      },
    })

    compiler.parseFileSource(
      '/Stack.tsx',
      `import { stack } from '@panda/patterns'
         import { Stack } from '@panda/jsx'
         stack({ gap: { base: '4', _hover: '8px' } })
         const el = <Stack gap="var(--gap)" />`,
    )

    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
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

  it('wires pattern transform callbacks through an initialized wasm module', async () => {
    const mod = await loadWasm()
    const compiler = createCompilerFromWasmModule(
      mod,
      {
        ...baseConfig,
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
      {
        callbacks: {
          'pattern.transform': {
            'patterns.stack.transform': (props) => ({
              display: 'flex',
              gap: props.gap,
            }),
          },
        },
      },
    )

    compiler.parseFileSource('/Stack.tsx', `import { stack } from '@panda/patterns'\nstack({ gap: '4px' })`)

    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
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

  it('applies pattern defaultValues before wasm pattern transform callbacks', async () => {
    const compiler = await createCompilerFromSnapshot({
      config: {
        ...baseConfig,
        patterns: {
          stack: {
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
          'patterns.stack.defaultValues': () => ({
            gap: '2px',
          }),
        },
        'pattern.transform': {
          'patterns.stack.transform': (props) => ({
            display: 'flex',
            gap: props.gap,
          }),
        },
      },
    })

    compiler.parseFileSource(
      '/Stack.tsx',
      `import { stack } from '@panda/patterns'
         stack({})
         stack({ gap: '4px' })`,
    )

    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
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
            "value": "4px",
            "conditions": [],
          },
        ]
      `)
  })
})

describeMissingWasm()
