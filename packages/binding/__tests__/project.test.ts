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
