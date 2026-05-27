import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCompiler } from '../src'
import { createProject, importMap } from './test-utils'

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
          _hover: '&:hover',
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
