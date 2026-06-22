import { describe, expect, it } from 'vitest'
import { createCompiler } from '../src'
import { createProject, importMap } from './test-utils'

describe('Compiler recipes', () => {
  it('records cva recipes', () => {
    const compiler = createProject()
    compiler.parseFileSource(
      '/Button.tsx',
      `import { cva } from '@panda/css'
       export const button = cva({
         base: { fontWeight: 'bold' },
         variants: { size: { sm: { fontSize: 'sm' }, lg: { fontSize: 'lg' } } },
         defaultVariants: { size: 'sm' },
       })`,
    )
    const recipes = compiler.recipes()
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
    const compiler = createCompiler(
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

    expect(compiler.summary()).toMatchInlineSnapshot(`
      {
        "filesProcessed": 0,
        "atomCount": 0,
        "recipeCount": 1,
        "slotRecipeCount": 1,
      }
    `)
    expect(compiler.recipes().map(({ file }) => file)).toEqual(['theme.recipes.button'])
    expect(compiler.slotRecipes().map(({ file }) => file)).toEqual(['theme.slotRecipes.card'])

    compiler.parseFileSource('/Button.tsx', `import { css } from '@panda/css'\ncss({ margin: '8px' })`)
    compiler.clear()
    expect(compiler.summary().recipeCount).toBe(1)
    expect(compiler.summary().slotRecipeCount).toBe(1)
    expect(compiler.atoms()).toEqual([])
    expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
      {
        "base": [],
        "variants": [],
        "atomic": [],
      }
    `)
  })

  it('splits config recipe component props from style props', () => {
    const compiler = createCompiler(
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

    const report = compiler.parseFileSource(
      '/Button.tsx',
      `import { Action, Tabs, TabsRoot } from './components'
       const el = <>
         <Action size="sm" color="red" />
         <Tabs.Root size="sm" padding="2px" />
         <TabsRoot size="sm" margin="8px" />
       </>`,
    )

    expect(report.jsxUsages).toBe(3)
    expect(compiler.atoms()).toMatchInlineSnapshot(`
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
    expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
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

  it('does not emit style utilities for dotted recipe variant values', () => {
    const compiler = createCompiler(
      {
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap,
        theme: {
          recipes: {
            button: {
              jsx: ['ButtonLink'],
              variants: {
                color: {
                  'ghost.white': {
                    color: 'white',
                  },
                },
              },
            },
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource(
      '/Button.tsx',
      `import { ButtonLink } from './button'
       export const button = <ButtonLink color="ghost.white" />`,
    )

    expect(compiler.getLayerCss({ layers: ['recipes', 'utilities'] }).css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer variants {
          .button--color_ghost\\.white {
            color: white;
          }
        }
      }
      "
    `)
  })

  it('tracks config recipe function calls', () => {
    const compiler = createCompiler(
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

    compiler.parseFileSource(
      '/recipes.ts',
      `import { button } from '@panda/recipes'
       import * as recipes from '@panda/recipes'
       button({ size: 'sm', color: 'red' })
       recipes.tabs({ size: 'sm', margin: '8px' })`,
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
    const compiler = createCompiler(
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

    compiler.parseFileSource(
      '/recipes.ts',
      `import { button } from '@panda/recipes'
       button({ size: { base: 'sm', md: 'md' } })`,
    )

    expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
      {
        "base": [],
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
            "recipe": "button",
            "slot": null,
            "className": "button--size_md",
            "conditions": [
              "md",
            ],
            "entries": [
              {
                "prop": "fontSize",
                "value": "16px",
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
