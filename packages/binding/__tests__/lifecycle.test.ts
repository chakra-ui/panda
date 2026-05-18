import { describe, expect, it } from 'vitest'
import { Project } from '../src'
import { matchers } from './test-utils'

describe('Project lifecycle', () => {
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

    expect(project.refreshFile('/unknown.tsx', `whatever`)).toBe(false)
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
})
