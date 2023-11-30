import { mergeConfigs } from '@pandacss/config'
import { config as fixtureConfig } from '@pandacss/fixture'
import { Generator } from '@pandacss/generator'
import { parseJson, stringifyJson } from '@pandacss/shared'
import type { Config, ConfigResultWithHooks, UserConfig } from '@pandacss/types'
import { createHooks } from 'hookable'
import { describe, expect, test } from 'vitest'
import { DiffEngine } from '../src/diff-engine'

const common: Partial<ConfigResultWithHooks> = {
  dependencies: [],
  path: '',
  hooks: createHooks(),
}

const createConfigResult = (config: UserConfig) => {
  const conf = { ...common, config }

  const serialized = stringifyJson(conf.config)
  const deserialize = () => parseJson(serialized)

  return { ...conf, serialized, deserialize } as ConfigResultWithHooks
}

describe('DiffEngine affecteds', () => {
  test('add theme.tokens', () => {
    const defaultConfig = (): Config => ({
      outdir: '',
      cwd: '',
      cssVarRoot: ':where(html)',
      ...fixtureConfig,
    })

    let generator = new Generator(createConfigResult(defaultConfig() as UserConfig))

    const diffEngine = new DiffEngine(generator)

    expect(generator.tokens.getByName('colors.newColor123')).toMatchInlineSnapshot('undefined')

    const nextConfig = mergeConfigs([
      {},
      defaultConfig(),
      {
        theme: {
          extend: {
            tokens: {
              colors: {
                newColor123: { value: 'blue.100' },
              },
            },
          },
        },
      },
    ])

    const affecteds = diffEngine.refresh(createConfigResult(nextConfig), (conf) => {
      generator = new Generator({ ...conf, hooks: generator.hooks })
    })

    expect(affecteds.artifacts).toMatchInlineSnapshot(`
      Set {
        "design-tokens",
        "types",
        "css-fn",
        "jsx-is-valid-prop",
        "styles.css",
      }
    `)
    expect(affecteds.diffs).toMatchInlineSnapshot(`
      [
        {
          "path": [
            "utilities",
            "colorPalette",
          ],
          "type": "CREATE",
          "value": {
            "transform": "transform(value) {
              return values[value];
            }",
            "values": [
              "current",
              "black",
              "white",
              "transparent",
              "rose",
              "pink",
              "fuchsia",
              "purple",
              "violet",
              "indigo",
              "blue",
              "sky",
              "cyan",
              "teal",
              "emerald",
              "green",
              "lime",
              "yellow",
              "amber",
              "orange",
              "red",
              "neutral",
              "stone",
              "zinc",
              "gray",
              "slate",
              "deep",
              "deep.test",
              "deep.test.pool",
              "primary",
              "secondary",
              "complex",
              "surface",
              "button",
              "button.card",
            ],
          },
        },
        {
          "path": [
            "utilities",
            "textStyle",
          ],
          "type": "CREATE",
          "value": {
            "className": "textStyle",
            "layer": "compositions",
            "transform": "(value) => {
              return __vite_ssr_import_1__.serializeStyle(flatValues[value], ctx);
            }",
            "values": [
              "xs",
              "sm",
              "md",
              "lg",
              "xl",
              "2xl",
              "3xl",
              "4xl",
              "5xl",
              "6xl",
              "7xl",
              "8xl",
              "9xl",
            ],
          },
        },
        {
          "path": [
            "theme",
            "tokens",
            "colors",
            "newColor123",
          ],
          "type": "CREATE",
          "value": {
            "value": "blue.100",
          },
        },
      ]
    `)

    expect(generator.tokens.getByName('colors.newColor123')).toMatchInlineSnapshot(`
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "newColor123",
          "colorPaletteRoots": [
            "newColor123",
          ],
          "colorPaletteTokenKeys": [
            "",
          ],
          "condition": "base",
          "prop": "newColor123",
          "var": "--colors-new-color123",
          "varRef": "var(--colors-new-color123)",
        },
        "name": "colors.newColor123",
        "originalValue": "blue.100",
        "path": [
          "colors",
          "newColor123",
        ],
        "type": "color",
        "value": "blue.100",
      }
    `)

    const resetConfig = mergeConfigs([{}, defaultConfig()])

    const affectedsAfterReset = diffEngine.refresh(createConfigResult(resetConfig))
    expect(affectedsAfterReset.artifacts).toMatchInlineSnapshot(`
      Set {
        "design-tokens",
        "types",
        "css-fn",
        "jsx-is-valid-prop",
        "styles.css",
      }
    `)
    expect(affectedsAfterReset.diffs).toMatchInlineSnapshot(`
      [
        {
          "oldValue": {
            "value": "blue.100",
          },
          "path": [
            "theme",
            "tokens",
            "colors",
            "newColor123",
          ],
          "type": "REMOVE",
        },
      ]
    `)

    expect(generator.tokens.getByName('colors.newColor123')).toMatchInlineSnapshot(`
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "newColor123",
          "colorPaletteRoots": [
            "newColor123",
          ],
          "colorPaletteTokenKeys": [
            "",
          ],
          "condition": "base",
          "prop": "newColor123",
          "var": "--colors-new-color123",
          "varRef": "var(--colors-new-color123)",
        },
        "name": "colors.newColor123",
        "originalValue": "blue.100",
        "path": [
          "colors",
          "newColor123",
        ],
        "type": "color",
        "value": "blue.100",
      }
    `)
  })

  test('update theme.tokens', () => {
    const defaultConfig = (): Config => ({
      outdir: '',
      cwd: '',
      cssVarRoot: ':where(html)',
      ...fixtureConfig,
    })

    const generator = new Generator(createConfigResult(defaultConfig() as UserConfig))
    const diffEngine = new DiffEngine(generator)
    const nextConfig = mergeConfigs([
      {},
      defaultConfig(),
      {
        theme: {
          extend: {
            tokens: {
              colors: {
                blue: {
                  100: { value: 'red.100' },
                },
              },
            },
          },
        },
      },
    ])

    expect(generator.tokens.getByName('colors.blue.100')).toMatchInlineSnapshot(`
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "blue",
          "colorPaletteRoots": [
            "blue",
          ],
          "colorPaletteTokenKeys": [
            "100",
          ],
          "condition": "base",
          "prop": "blue.100",
          "var": "--colors-blue-100",
          "varRef": "var(--colors-blue-100)",
        },
        "name": "colors.blue.100",
        "originalValue": "#dbeafe",
        "path": [
          "colors",
          "blue",
          "100",
        ],
        "type": "color",
        "value": "#dbeafe",
      }
    `)

    const affecteds = diffEngine.refresh(createConfigResult(nextConfig))
    expect(affecteds.artifacts).toMatchInlineSnapshot(`
      Set {
        "design-tokens",
        "types",
        "css-fn",
        "jsx-is-valid-prop",
        "styles.css",
      }
    `)
    expect(affecteds.diffs).toMatchInlineSnapshot(`
      [
        {
          "oldValue": "#dbeafe",
          "path": [
            "theme",
            "tokens",
            "colors",
            "blue",
            "100",
            "value",
          ],
          "type": "CHANGE",
          "value": "red.100",
        },
      ]
    `)

    expect(generator.tokens.getByName('colors.blue.100')).toMatchInlineSnapshot(`
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "blue",
          "colorPaletteRoots": [
            "blue",
          ],
          "colorPaletteTokenKeys": [
            "100",
          ],
          "condition": "base",
          "prop": "blue.100",
          "var": "--colors-blue-100",
          "varRef": "var(--colors-blue-100)",
        },
        "name": "colors.blue.100",
        "originalValue": "#dbeafe",
        "path": [
          "colors",
          "blue",
          "100",
        ],
        "type": "color",
        "value": "#dbeafe",
      }
    `)
  })

  test('add theme.recipes', () => {
    const defaultConfig = (): Config => ({
      outdir: '',
      cwd: '',
      cssVarRoot: ':where(html)',
      ...fixtureConfig,
    })

    const config = defaultConfig() as UserConfig
    const generator = new Generator(createConfigResult(config))
    const diffEngine = new DiffEngine(generator)
    const nextConfig = mergeConfigs([
      {},
      config,
      {
        theme: {
          extend: {
            recipes: {
              newRecipe: {
                className: 'newRecipe',
                base: { color: 'blue.200' },
              },
            },
          },
        },
      },
    ])
    // console.log(4, nextConfig.utilities.colorPalette)

    expect(generator.recipes.getConfig('newRecipe')).toMatchInlineSnapshot('undefined')

    const affecteds = diffEngine.refresh(createConfigResult(nextConfig))
    expect(affecteds.artifacts).toMatchInlineSnapshot(`
      Set {
        "recipes-index",
        "recipes.new-recipe",
        "recipes",
      }
    `)
    expect(affecteds.diffs).toMatchInlineSnapshot(`
      [
        {
          "path": [
            "theme",
            "recipes",
            "newRecipe",
          ],
          "type": "CREATE",
          "value": {
            "base": {
              "color": "blue.200",
            },
            "className": "newRecipe",
          },
        },
      ]
    `)

    expect(generator.recipes.getConfig('newRecipe')).toMatchInlineSnapshot('undefined')

    const resetConfig = mergeConfigs([{}, defaultConfig()])

    const affectedsAfterReset = diffEngine.refresh(createConfigResult(resetConfig))
    expect(affectedsAfterReset.artifacts).toMatchInlineSnapshot(`
      Set {
        "recipes-index",
        "recipes.new-recipe",
        "recipes",
      }
    `)
    expect(affectedsAfterReset.diffs).toMatchInlineSnapshot(`
      [
        {
          "oldValue": {
            "base": {
              "color": "blue.200",
            },
            "className": "newRecipe",
          },
          "path": [
            "theme",
            "recipes",
            "newRecipe",
          ],
          "type": "REMOVE",
        },
      ]
    `)

    expect(generator.recipes.getConfig('newRecipe')).toMatchInlineSnapshot('undefined')
  })

  test('update theme.recipes', () => {
    const defaultConfig = (): Config => ({
      outdir: '',
      cwd: '',
      cssVarRoot: ':where(html)',
      ...fixtureConfig,
    })

    const generator = new Generator(createConfigResult(defaultConfig() as UserConfig))
    const diffEngine = new DiffEngine(generator)
    const nextConfig = mergeConfigs([
      {},
      defaultConfig(),
      {
        theme: {
          extend: {
            recipes: {
              buttonStyle: {
                className: 'button123',
                base: { color: 'blue.300' },
              },
            },
          },
        },
      },
    ])

    const affecteds = diffEngine.refresh(createConfigResult(nextConfig))
    expect(affecteds.artifacts).toMatchInlineSnapshot(`
      Set {
        "recipes-index",
        "recipes.button-style",
        "recipes",
      }
    `)
    expect(affecteds.diffs).toMatchInlineSnapshot(`
      [
        {
          "oldValue": "buttonStyle",
          "path": [
            "theme",
            "recipes",
            "buttonStyle",
            "className",
          ],
          "type": "CHANGE",
          "value": "button123",
        },
        {
          "path": [
            "theme",
            "recipes",
            "buttonStyle",
            "base",
            "color",
          ],
          "type": "CREATE",
          "value": "blue.300",
        },
      ]
    `)
  })

  test('add theme.patterns', () => {
    const defaultConfig = (): Config => ({
      outdir: '',
      cwd: '',
      cssVarRoot: ':where(html)',
      ...fixtureConfig,
    })

    const generator = new Generator(createConfigResult(defaultConfig() as UserConfig))
    const diffEngine = new DiffEngine(generator)
    const nextConfig = mergeConfigs([
      {},
      defaultConfig(),
      {
        patterns: {
          extend: {
            newPattern: {
              transform() {
                return { color: 'blue.400' }
              },
            },
          },
        },
      },
    ])

    const affecteds = diffEngine.refresh(createConfigResult(nextConfig))
    expect(affecteds.artifacts).toMatchInlineSnapshot(`
      Set {
        "patterns-index",
        "patterns.new-pattern",
        "patterns",
        "jsx-patterns",
        "jsx-patterns-index",
      }
    `)
    expect(affecteds.diffs).toMatchInlineSnapshot(`
      [
        {
          "path": [
            "patterns",
            "newPattern",
          ],
          "type": "CREATE",
          "value": {
            "transform": "transform() {
                      return { color: \\"blue.400\\" };
                    }",
          },
        },
      ]
    `)

    const nextConfigChangeTransform = mergeConfigs([
      {},
      nextConfig,
      {
        patterns: {
          extend: {
            newPattern: {
              transform() {
                return { color: 'blue.500' }
              },
            },
          },
        },
      },
    ])

    const affectedsChangeTransform = diffEngine.refresh(createConfigResult(nextConfigChangeTransform))
    expect(affectedsChangeTransform.artifacts).toMatchInlineSnapshot(`
      Set {
        "patterns-index",
        "patterns.new-pattern",
        "patterns",
        "jsx-patterns",
        "jsx-patterns-index",
      }
    `)
    expect(affectedsChangeTransform.diffs).toMatchInlineSnapshot(`
      [
        {
          "oldValue": "transform() {
                      return { color: \\"blue.400\\" };
                    }",
          "path": [
            "patterns",
            "newPattern",
            "transform",
          ],
          "type": "CHANGE",
          "value": "transform() {
                      return { color: \\"blue.500\\" };
                    }",
        },
      ]
    `)

    const resetConfig = mergeConfigs([{}, defaultConfig()])

    const affectedsAfterReset = diffEngine.refresh(createConfigResult(resetConfig))
    expect(affectedsAfterReset.artifacts).toMatchInlineSnapshot(`
      Set {
        "patterns-index",
        "patterns.new-pattern",
        "patterns",
        "jsx-patterns",
        "jsx-patterns-index",
      }
    `)
    expect(affectedsAfterReset.diffs).toMatchInlineSnapshot(`
      [
        {
          "oldValue": {
            "transform": "transform() {
                      return { color: \\"blue.500\\" };
                    }",
          },
          "path": [
            "patterns",
            "newPattern",
          ],
          "type": "REMOVE",
        },
      ]
    `)
  })

  test('update theme.patterns', () => {
    const defaultConfig = (): Config => ({
      outdir: '',
      cwd: '',
      cssVarRoot: ':where(html)',
      ...fixtureConfig,
    })

    const generator = new Generator(createConfigResult(defaultConfig() as UserConfig))
    const diffEngine = new DiffEngine(generator)
    const nextConfig = mergeConfigs([
      {},
      defaultConfig(),
      {
        patterns: {
          extend: {
            flex: {
              description: 'flex111',
            },
          },
        },
      },
    ])

    const affecteds = diffEngine.refresh(createConfigResult(nextConfig))
    expect(affecteds.artifacts).toMatchInlineSnapshot(`
      Set {
        "patterns-index",
        "patterns.flex",
        "patterns",
        "jsx-patterns",
        "jsx-patterns-index",
      }
    `)
    expect(affecteds.diffs).toMatchInlineSnapshot(`
      [
        {
          "path": [
            "patterns",
            "flex",
            "description",
          ],
          "type": "CREATE",
          "value": "flex111",
        },
      ]
    `)
  })

  test('update separator', () => {
    const defaultConfig = (): Config => ({
      outdir: '',
      cwd: '',
      cssVarRoot: ':where(html)',
      ...fixtureConfig,
    })

    let generator = new Generator(createConfigResult(defaultConfig() as UserConfig))
    const diffEngine = new DiffEngine(generator)

    expect(generator.config.separator).toMatchInlineSnapshot('undefined')
    expect(generator.utility.separator).toMatchInlineSnapshot('"_"')
    expect(generator.recipes['separator']).toMatchInlineSnapshot('"_"')

    const nextConfig = {
      ...defaultConfig(),
      separator: '=',
    } as UserConfig

    const affecteds = diffEngine.refresh(createConfigResult(nextConfig), (conf) => {
      generator = new Generator({ ...conf, hooks: generator.hooks })
    })

    expect(generator.config.separator).toMatchInlineSnapshot('"="')
    expect(generator.utility.separator).toMatchInlineSnapshot('"="')
    expect(generator.recipes['separator']).toMatchInlineSnapshot('"="')

    expect(affecteds.artifacts).toMatchInlineSnapshot(`
      Set {
        "types",
        "css-fn",
        "create-recipe",
        "jsx-is-valid-prop",
        "styles.css",
      }
    `)
    expect(affecteds.diffs).toMatchInlineSnapshot(`
      [
        {
          "path": [
            "separator",
          ],
          "type": "CREATE",
          "value": "=",
        },
      ]
    `)
  })
})
