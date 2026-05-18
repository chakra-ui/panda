import { describe, expect, it } from 'vitest'
import { Project } from '../src'
import { importMap, matchers } from './test-utils'

describe('Project recipes', () => {
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

  it('tracks config recipes and slot recipes', () => {
    const project = Project.fromConfig(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap,
        theme: {
          recipes: {
            button: {
              base: { display: 'inline-flex' },
              variants: { size: { sm: { fontSize: '12px' } } },
            },
          },
          slotRecipes: {
            card: {
              slots: ['root', 'label'],
              base: {
                root: { padding: '4px' },
                label: { color: 'red' },
              },
            },
          },
        },
      },
      { crossFile: false },
    )

    expect(project.summary()).toMatchInlineSnapshot(`
      {
        "filesProcessed": 0,
        "atomCount": 0,
        "recipeCount": 1,
        "slotRecipeCount": 1,
      }
    `)
    expect(project.recipes().map(({ file }) => file)).toEqual(['theme.recipes.button'])
    expect(project.slotRecipes().map(({ file }) => file)).toEqual(['theme.slotRecipes.card'])

    project.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ margin: '8px' })`)
    project.clear()
    expect(project.summary().recipeCount).toBe(1)
    expect(project.summary().slotRecipeCount).toBe(1)
    expect(project.atoms()).toEqual([])
    expect(project.encodedRecipes()).toMatchInlineSnapshot(`
      {
        "base": [],
        "variants": [],
        "atomic": [],
      }
    `)
  })

  it('splits config recipe component props from style props', () => {
    const project = Project.fromConfig(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap,
        theme: {
          recipes: {
            button: {
              jsx: ['Action'],
              base: { display: 'inline-flex' },
              variants: { size: { sm: { fontSize: '12px' } } },
            },
          },
          slotRecipes: {
            tabs: {
              jsx: ['Tabs'],
              slots: ['root'],
              variants: {
                size: {
                  sm: { root: { gap: '4px' } },
                },
              },
            },
          },
        },
      },
      { crossFile: false },
    )

    const report = project.parseFile(
      '/Button.tsx',
      `import { Action, Tabs, TabsRoot } from './components'
       const el = <>
         <Action size="sm" color="red" />
         <Tabs.Root size="sm" padding="2px" />
         <TabsRoot size="sm" margin="8px" />
       </>`,
    )

    expect(report.jsxUsages).toBe(3)
    expect(project.atoms()).toMatchInlineSnapshot(`
      [
        {
          "prop": "color",
          "value": "red",
          "conditions": [],
        },
        {
          "prop": "margin",
          "value": "8px",
          "conditions": [],
        },
        {
          "prop": "padding",
          "value": "2px",
          "conditions": [],
        },
      ]
    `)
    expect(project.encodedRecipes()).toMatchInlineSnapshot(`
      {
        "base": [
          {
            "recipe": "button",
            "slot": null,
            "className": "button",
            "entries": [
              {
                "prop": "display",
                "value": "inline-flex",
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
                "prop": "fontSize",
                "value": "12px",
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
                "prop": "gap",
                "value": "4px",
                "conditions": [],
              },
            ],
          },
        ],
        "atomic": [],
      }
    `)
  })

  it('tracks config recipe function calls', () => {
    const project = Project.fromConfig(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap,
        theme: {
          recipes: {
            button: {
              base: { display: 'inline-flex' },
              variants: { size: { sm: { fontSize: '12px' } } },
            },
          },
          slotRecipes: {
            tabs: {
              slots: ['root'],
              variants: {
                size: {
                  sm: { root: { gap: '4px' } },
                },
              },
            },
          },
        },
      },
      { crossFile: false },
    )

    project.parseFile(
      '/recipes.ts',
      `import { button } from '@panda/recipes'
       import * as recipes from '@panda/recipes'
       button({ size: 'sm', color: 'red' })
       recipes.tabs({ size: 'sm', margin: '8px' })`,
    )

    expect(project.atoms()).toEqual([])
    expect(project.encodedRecipes()).toMatchInlineSnapshot(`
      {
        "base": [
          {
            "recipe": "button",
            "slot": null,
            "className": "button",
            "entries": [
              {
                "prop": "display",
                "value": "inline-flex",
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
                "prop": "fontSize",
                "value": "12px",
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
                "prop": "gap",
                "value": "4px",
                "conditions": [],
              },
            ],
          },
        ],
        "atomic": [],
      }
    `)
  })

  it('tracks conditional config recipe variants', () => {
    const project = Project.fromConfig(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap,
        theme: {
          breakpoints: {
            md: '768px',
          },
          recipes: {
            button: {
              variants: {
                size: {
                  sm: { fontSize: '12px' },
                  md: { fontSize: '16px' },
                },
              },
            },
          },
        },
      },
      { crossFile: false },
    )

    project.parseFile(
      '/recipes.ts',
      `import { button } from '@panda/recipes'
       button({ size: { base: 'sm', md: 'md' } })`,
    )

    expect(project.encodedRecipes()).toMatchInlineSnapshot(`
      {
        "base": [],
        "variants": [
          {
            "recipe": "button",
            "slot": null,
            "className": "button--size_md",
            "entries": [
              {
                "prop": "fontSize",
                "value": "16px",
                "conditions": [
                  "md",
                ],
              },
            ],
          },
          {
            "recipe": "button",
            "slot": null,
            "className": "button--size_sm",
            "entries": [
              {
                "prop": "fontSize",
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
})
