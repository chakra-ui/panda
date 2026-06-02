import { expect, it } from 'vitest'

import { createCompiler } from '../src'
import type { Atom } from '../src'
import { baseConfig, describeIfBuilt, describeMissingWasm } from './helpers'

describeIfBuilt('@pandacss/compiler-wasm project', () => {
  it('extracts atoms from a css() call', async () => {
    const compiler = await createCompiler(baseConfig)
    expect(compiler.isEmpty()).toBe(true)
    compiler.parseFileSource('/Button.tsx', `import { css } from '@panda/css'\ncss({ color: 'red', bg: 'blue' })`)
    expect(compiler.isEmpty()).toBe(false)
    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
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

  it('constructs from a serialized config snapshot', async () => {
    const compiler = await createCompiler({
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
    })

    expect(compiler.config()).toMatchObject({
      cwd: '/virtual',
      outdir: 'styled-system',
    })
    compiler.parseFileSource('/Button.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "red",
            "conditions": [],
          },
        ]
      `)
  })

  it('generates codegen artifacts from resolved state', async () => {
    const compiler = await createCompiler({
      ...baseConfig,
      theme: {
        tokens: {
          colors: {
            red: { 500: { value: '#f00' } },
          },
        },
      },
      utilities: {
        color: { className: 'c', values: 'colors' },
      },
    })
    const artifact = compiler.generateArtifact('types')

    expect(artifact?.files.map((file) => file.path)).toMatchInlineSnapshot(`
      [
        "types/tokens.d.mts",
        "types/system.d.mts",
        "types/pattern.d.mts",
        "types/recipe.d.mts",
        "types/index.d.mts",
      ]
    `)
  })

  it('derives JSX pattern matchers from config', async () => {
    const compiler = await createCompiler({
      cwd: '/virtual',
      outdir: 'styled-system',
      importMap: {
        css: ['@panda/css'],
        recipe: ['@panda/recipes'],
        pattern: ['@panda/patterns'],
        jsx: ['@panda/jsx'],
        tokens: ['@panda/tokens'],
      },
      patterns: {
        stack: {
          properties: {
            gap: {},
          },
        },
      },
    })

    compiler.parseFileSource('/Stack.tsx', `import { Stack } from '@panda/jsx'\nconst el = <Stack gap="4" />`)
    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "gap",
            "value": "4",
            "conditions": [],
          },
        ]
      `)
  })

  it('cross-file imports fold via the shared WasmFileSystem', async () => {
    const compiler = await createCompiler(baseConfig)
    compiler.fs!.addFile('/proj/tokens.ts', "export const brand = '#ef4444'\n")
    compiler.parseFileSource(
      '/proj/main.tsx',
      `import { brand } from './tokens'\nimport { css } from '@panda/css'\ncss({ color: brand })`,
    )
    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "#ef4444",
            "conditions": [],
          },
        ]
      `)
  })

  it('dedups atoms across files', async () => {
    const compiler = await createCompiler(baseConfig)
    compiler.parseFileSource('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    compiler.parseFileSource('/b.tsx', `import { css } from '@panda/css'\ncss({ color: 'red', bg: 'blue' })`)
    compiler.parseFileSource('/c.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    expect((compiler.atoms() as Atom[]).length).toBe(2)
    const summary = compiler.summary()
    expect(summary).toMatchInlineSnapshot(`
        {
          "filesProcessed": 3,
          "atomCount": 2,
          "recipeCount": 0,
          "slotRecipeCount": 0,
        }
      `)
  })

  it('refresh and remove update the atom set', async () => {
    const compiler = await createCompiler(baseConfig)
    compiler.parseFileSource('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    expect(compiler.refreshFileSource('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'blue' })`)).toBe(true)
    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "blue",
            "conditions": [],
          },
        ]
      `)
    expect(compiler.refreshFileSource('/unknown.tsx', 'whatever')).toBe(false)
    expect(compiler.removeFile('/a.tsx')).toBe(true)
    expect(compiler.removeFile('/a.tsx')).toBe(false)
    expect(compiler.atoms() as Atom[]).toEqual([])
  })

  it('records cva recipes', async () => {
    const compiler = await createCompiler(baseConfig)
    compiler.parseFileSource(
      '/Button.tsx',
      `import { cva } from '@panda/css'\nexport const btn = cva({ base: { p: '2' } })`,
    )
    const recipes = compiler.recipes()
    expect(recipes).toHaveLength(1)
    expect(recipes[0].file).toBe('/Button.tsx')
    expect(recipes[0].recipe).toMatchInlineSnapshot(`
        {
          "base": {
            "p": "2",
          },
        }
      `)
  })

  it('tracks config recipes and slot recipes', async () => {
    const compiler = await createCompiler({
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
    })

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
    expect(compiler.atoms() as Atom[]).toEqual([])
    expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
        {
          "base": [],
          "variants": [],
          "atomic": [],
        }
      `)
  })

  it('splits config recipe component props from style props', async () => {
    const compiler = await createCompiler({
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
    })

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
    expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
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

  it('tracks config recipe function calls', async () => {
    const compiler = await createCompiler({
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
    })

    compiler.parseFileSource(
      '/recipes.ts',
      `import { button } from '@panda/recipes'
         import * as recipes from '@panda/recipes'
         button({ size: 'sm', color: 'red' })
         recipes.tabs({ size: 'sm', margin: '8px' })`,
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

  it('clear drops every file', async () => {
    const compiler = await createCompiler(baseConfig)
    compiler.parseFileSource('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
    compiler.parseFileSource('/b.tsx', `import { css } from '@panda/css'\ncss({ bg: 'blue' })`)
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

  it('tracks conditional config recipe variants', async () => {
    const compiler = await createCompiler({
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
    })

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

describeMissingWasm()
