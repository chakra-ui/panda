import { describe, expect, it } from 'vitest'
import { createProject } from './test-utils'

describe('Compiler lifecycle', () => {
  it('refresh and remove update the atom set', () => {
    const compiler = createProject()
    compiler.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
      ]
    `)

    expect(compiler.refreshFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'blue' })`)).toBe(true)
    expect(compiler.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "blue",
          "conditions": [],
        },
      ]
    `)

    expect(compiler.refreshFile('/unknown.tsx', `whatever`)).toBe(false)
    expect(compiler.removeFile('/a.tsx')).toBe(true)
    expect(compiler.removeFile('/a.tsx')).toBe(false)
    expect(compiler.atoms()).toEqual([])
    expect(compiler.summary().filesProcessed).toBe(0)
  })

  it('dedups atoms across files', () => {
    const compiler = createProject()
    compiler.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    compiler.parseFile('/b.tsx', `import { css } from '@panda/css'\ncss({ color: 'red', bg: 'blue' })`)
    compiler.parseFile('/c.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
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

  it('clear drops every file', () => {
    const compiler = createProject()
    compiler.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    compiler.parseFile('/b.tsx', `import { css } from '@panda/css'\ncss({ bg: 'blue' })`)
    expect(compiler.summary().filesProcessed).toBe(2)
    compiler.clear()
    expect(compiler.isEmpty()).toBe(true)
    expect(compiler.summary()).toMatchInlineSnapshot(`
      {
        "filesProcessed": 0,
        "atomCount": 0,
        "recipeCount": 0,
        "slotRecipeCount": 0,
      }
    `)
  })
})
