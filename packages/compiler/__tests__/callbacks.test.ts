import { describe, expect, it } from 'vitest'
import { createCompilerFromSnapshot } from '../src'
import { importMap } from './test-utils'

describe('Compiler callbacks', () => {
  it('applies filtered parser:before callbacks before extraction', () => {
    const seen: string[] = []
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
        },
        hooks: {
          'parser:before': [
            {
              id: 'plugins.0.hooks.parser:before.0',
              hash: 'fn1-test',
              filter: { id: { include: ['**/*.tsx'] }, code: { include: 'css(' } },
            },
          ],
        },
        callbacks: {
          'parser:before': {
            'plugins.0.hooks.parser:before.0': ({ filePath, content }) => {
              seen.push(filePath)
              return content.replace('__COLOR__', "'red'")
            },
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource('/virtual/Button.js', `import { css } from '@panda/css'; css({ color: __COLOR__ })`)
    compiler.parseFileSource('/virtual/Button.tsx', `import { css } from '@panda/css'; css({ color: __COLOR__ })`)

    expect(seen).toEqual(['/virtual/Button.tsx'])
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

  it('rejects async parser:before callbacks on the hot path', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
        },
        hooks: {
          'parser:before': [
            {
              id: 'plugins.0.hooks.parser:before.0',
              hash: 'fn1-test',
            },
          ],
        },
        callbacks: {
          'parser:before': {
            'plugins.0.hooks.parser:before.0': (() => Promise.resolve('')) as any,
          },
        },
      },
      { crossFile: false },
    )

    const report = compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'; css({ color: 'red' })`,
    )
    expect(report.diagnostics[0]?.message).toContain('must be synchronous')
    expect(compiler.atoms()).toEqual([])
  })

  it('applies js-backed utility transform callbacks from a config bundle', () => {
    const compiler = createCompilerFromSnapshot(
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
            'utilities.size.transform': (value) => ({
              width: value,
              height: value,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
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
          "prop": "size",
          "value": "4px",
          "conditions": [],
        },
      ]
    `)
  })

  it('passes token helpers to utility transform callbacks', () => {
    const compiler = createCompilerFromSnapshot(
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
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ tint: 'red.500/50' })`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "tint",
          "value": "red.500/50",
          "conditions": [],
        },
      ]
    `)
  })

  it('applies utility transform callbacks to encoded config recipes', () => {
    const compiler = createCompilerFromSnapshot(
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
            'utilities.size.transform': (value) => ({
              width: value,
              height: value,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
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
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
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
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ space: '4', _hover: { space: 'compact' } })`,
    )

    // Atoms carry the author's value-map key (`4`, `compact`), not the resolved
    // CSS — the class name is hashed from this key to match the runtime, and the
    // declaration value is resolved at emit time.
    expect(compiler.atoms()).toMatchInlineSnapshot(`
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

    expect(compiler.generateArtifact('types')?.files.find((file) => file.path === 'types/system.d.ts')?.code).toContain(
      'export type SpaceValue = "-4" | "4" | "compact" | CssVars | AnyString',
    )
  })

  it('resolves utility values functions from a config snapshot', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          utilities: {
            inset: {
              property: 'inset',
              values: {
                kind: 'js-callback',
                id: 'utilities.inset.values',
              },
            },
          },
          theme: {
            tokens: {
              spacing: {
                2: { value: '0.5rem' },
              },
            },
          },
        },
        callbacks: {
          'utility.values': {
            'utilities.inset.values': (theme) => ({
              ...(theme('spacing') ?? {}),
              full: '100%',
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/virtual/Dialog.tsx',
      `import { css } from '@panda/css'
       css({ inset: '2' })
       css({ inset: 'full' })`,
    )

    // Atoms carry the author's value-map key (`2`, `full`), not the resolved CSS
    // (`var(--spacing-2)`, `100%`) — class names hash from the key to match the
    // runtime; declaration values are resolved at emit time.
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "inset",
          "value": 2,
          "conditions": [],
        },
        {
          "prop": "inset",
          "value": "full",
          "conditions": [],
        },
      ]
    `)
    expect(compiler.generateArtifact('types')?.files.find((file) => file.path === 'types/system.d.ts')?.code).toContain(
      'export type InsetValue = "-2" | "2" | "full" | CssVars | AnyString',
    )
  })

  it('throws when serialized callback refs are missing callbacks', () => {
    expect(() =>
      createCompilerFromSnapshot(
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
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
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
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ _hover: { size: '4px' } })`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
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

  it('applies utility transform callbacks from JSX props', () => {
    const compiler = createCompilerFromSnapshot(
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
            'utilities.size.transform': (value) => ({
              width: value,
              height: value,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/virtual/Card.tsx',
      `import { Box } from '@panda/jsx'
       const el = <Box size="4px" />`,
    )

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

  it('caches utility transform callback results', () => {
    let calls = 0
    const compiler = createCompilerFromSnapshot(
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
            'utilities.size.transform': (value) => {
              calls += 1
              return { width: value, height: value }
            },
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ size: '4px', _hover: { size: '4px' } })`,
    )

    compiler.atoms()
    compiler.atoms()
    expect(calls).toBe(1)
  })

  it('reports utility transform callback failures during parseFile', () => {
    const compiler = createCompilerFromSnapshot(
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
            'utilities.size.transform': () => {
              throw new Error('boom')
            },
          },
        },
      },
      { crossFile: false },
    )

    const report = compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ size: '4px' })`,
    )

    expect(report.diagnostics.map(({ message, severity }) => ({ message, severity }))).toMatchInlineSnapshot(`
      [
        {
          "message": "Utility transform callback \`utilities.size.transform\` for \`size\` threw: Error: boom (utility \`size\` with value \`4px\`)",
          "severity": "warning",
        },
      ]
    `)
    expect(compiler.getFile('/virtual/Button.tsx')?.diagnostics.map(({ message, severity }) => ({ message, severity })))
      .toMatchInlineSnapshot(`
        [
          {
            "message": "Utility transform callback \`utilities.size.transform\` for \`size\` threw: Error: boom (utility \`size\` with value \`4px\`)",
            "severity": "warning",
          },
        ]
      `)
    expect(compiler.atoms()).toMatchInlineSnapshot(`[]`)
  })

  it('does not cache failed utility transform callbacks', () => {
    let calls = 0
    const compiler = createCompilerFromSnapshot(
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
            'utilities.size.transform': (value) => {
              calls += 1
              if (calls === 1) throw new Error('boom')
              return { width: value, height: value }
            },
          },
        },
      },
      { crossFile: false },
    )

    const source = `import { css } from '@panda/css'
       css({ size: '4px' })`

    const failed = compiler.parseFileSource('/virtual/Button.tsx', source)
    const retried = compiler.parseFileSource('/virtual/Button.tsx', source)

    expect(failed.diagnostics.map(({ message, severity }) => ({ message, severity }))).toMatchInlineSnapshot(`
      [
        {
          "message": "Utility transform callback \`utilities.size.transform\` for \`size\` threw: Error: boom (utility \`size\` with value \`4px\`)",
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

  it('applies utility transform callbacks during refreshFile', () => {
    const compiler = createCompilerFromSnapshot(
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
            'utilities.size.transform': (value) => ({ width: value, height: value }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({ size: '4px' })`,
    )
    expect(
      compiler.refreshFileSource(
        '/virtual/Button.tsx',
        `import { css } from '@panda/css'
       css({ size: '8px' })`,
      ),
    ).toBe(true)

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

  it('shares utility transform cache between atoms and encoded recipes', () => {
    let calls = 0
    const compiler = createCompilerFromSnapshot(
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
            'utilities.size.transform': (value) => {
              calls += 1
              return { width: value, height: value }
            },
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
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
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          conditions: {
            hover: '&:hover',
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
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
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
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
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
            'patterns.stack.transform': (props) => ({
              display: 'flex',
              flexDirection: 'column',
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
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
    const compiler = createCompilerFromSnapshot(
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
            'patterns.stack.transform': (props) => ({
              display: 'flex',
              flexDirection: 'column',
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
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
    const compiler = createCompilerFromSnapshot(
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
            'patterns.stack.transform': (props) => {
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

    compiler.parseFileSource(
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
    const compiler = createCompilerFromSnapshot(
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
            'patterns.stack.transform': (props) => {
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

    compiler.parseFileSource(
      '/virtual/Stack.ts',
      `import { stack } from '@panda/patterns'
       stack({ gap: '4px' })`,
    )
    compiler.parseFileSource(
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
    const compiler = createCompilerFromSnapshot(
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
            'patterns.stack.transform': (props) => ({
              display: 'flex',
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
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
    const compiler = createCompilerFromSnapshot(
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
            'patterns.stack.defaultValues': (props) => ({
              gap: props.dense ? '2px' : '4px',
            }),
          },
          'pattern.transform': {
            'patterns.stack.transform': (props) => ({
              display: 'flex',
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
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

  it('routes stack and hstack imports to their pattern transforms', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          patterns: {
            stack: {
              properties: { align: {} },
              defaultValues: { direction: 'column', gap: '8px' },
              transform: {
                kind: 'js-callback',
                id: 'patterns.stack.transform',
              },
            },
            hstack: {
              properties: { justify: {} },
              defaultValues: { gap: '8px' },
              transform: {
                kind: 'js-callback',
                id: 'patterns.hstack.transform',
              },
            },
          },
        },
        callbacks: {
          'pattern.transform': {
            'patterns.stack.transform': (props) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: props.align,
            }),
            'patterns.hstack.transform': (props) => ({
              display: 'flex',
              flexDirection: 'row',
              justifyContent: props.justify,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { stack, hstack as aliased } from '@panda/patterns'
       stack({ align: 'center' })
       aliased({ justify: 'flex-end' })`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "alignItems",
          "value": "center",
          "conditions": [],
        },
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
          "prop": "flexDirection",
          "value": "row",
          "conditions": [],
        },
        {
          "prop": "justifyContent",
          "value": "flex-end",
          "conditions": [],
        },
      ]
    `)
  })

  it('applies pattern transform callbacks from JSX with align and conditional gap', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          conditions: {
            hover: '&:hover',
          },
          patterns: {
            stack: {
              jsxName: 'Stack',
              properties: {
                align: {},
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
            'patterns.stack.transform': (props) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: props.align,
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/virtual/Stack.tsx',
      `import { Stack } from '@panda/jsx'
       const el = <Stack align="center" gap={{ base: '4px', _hover: '8px' }} />`,
    )

    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "alignItems",
          "value": "center",
          "conditions": [],
        },
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

  it('expands staticCss.patterns through pattern transform callbacks', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          utilities: {
            alignItems: { className: 'ai' },
          },
          patterns: {
            stack: {
              properties: {
                align: { type: 'enum', value: ['center', 'start'] },
              },
              transform: {
                kind: 'js-callback',
                id: 'patterns.stack.transform',
              },
            },
          },
          staticCss: {
            patterns: {
              stack: [{ properties: { align: ['center'] } }],
            },
          },
        },
        callbacks: {
          'pattern.transform': {
            'patterns.stack.transform': (props) => ({
              display: 'flex',
              alignItems: props.align,
            }),
          },
        },
      },
      { crossFile: false },
    )

    expect(compiler.staticPatternAtoms()).toMatchInlineSnapshot(`
      {
        "atoms": [
          {
            "prop": "alignItems",
            "value": "center",
            "conditions": [],
          },
          {
            "prop": "display",
            "value": "flex",
            "conditions": [],
          },
        ],
        "diagnostics": [],
      }
    `)
  })

  it('emits one grouped class with token-resolved values for a multi-declaration transform', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          theme: { tokens: { spacing: { '4': { value: '1rem' } } } },
          utilities: {
            spaceX: {
              className: 'space-x',
              values: 'spacing',
              transform: { kind: 'js-callback', id: 'utilities.spaceX.transform' },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            // `value` is the resolved token (`var(--spacing-4)`).
            'utilities.spaceX.transform': (value) => ({ marginLeft: value, marginRight: value }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource('/virtual/Button.tsx', `import { css } from '@panda/css'\ncss({ spaceX: '4' })`)

    expect(compiler.layerCss(['utilities'])).toMatchInlineSnapshot(`
      "@layer utilities {
        .space-x_4 {
          margin-left: var(--spacing-4);
          margin-right: var(--spacing-4);
        }
      }
      "
    `)
  })

  it('preserves !important across a transform result', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          theme: { tokens: { colors: { red: { '500': { value: '#f00' } } } } },
          utilities: {
            boxColor: {
              className: 'bc',
              values: 'colors',
              transform: { kind: 'js-callback', id: 'utilities.boxColor.transform' },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.boxColor.transform': (value) => ({ color: value }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource('/virtual/Button.tsx', `import { css } from '@panda/css'\ncss({ boxColor: 'red.500!' })`)

    expect(compiler.layerCss(['utilities'])).toMatchInlineSnapshot(`
      "@layer utilities {
        .bc_red\\.500\\! {
          color: var(--colors-red-500) !important;
        }
      }
      "
    `)
  })

  it('lowers a condition returned by a transform to a selector', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          conditions: { hover: '&:hover' },
          utilities: {
            debug: {
              className: 'debug',
              transform: { kind: 'js-callback', id: 'utilities.debug.transform' },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.debug.transform': () => ({ _hover: { border: '2px solid blue' } }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource('/virtual/Button.tsx', `import { css } from '@panda/css'\ncss({ debug: true })`)

    expect(compiler.layerCss(['utilities'])).toMatchInlineSnapshot(`
      "@layer utilities {
        .debug_true:hover {
          border: 2px solid blue;
        }
      }
      "
    `)
  })
})
