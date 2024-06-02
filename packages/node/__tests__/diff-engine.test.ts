import { mergeConfigs } from '@pandacss/config'
import { fixtureDefaults } from '@pandacss/fixture'
import { Generator } from '@pandacss/generator'
import { parseJson, stringifyJson } from '@pandacss/shared'
import type { Config, LoadConfigResult, UserConfig } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { DiffEngine } from '../src/diff-engine'

const common: Partial<LoadConfigResult> = {
  dependencies: [],
  path: '',
  hooks: {},
}

const createConfigResult = (config: UserConfig) => {
  const conf = { ...common, config: { ...config, include: [] } }

  const serialized = stringifyJson(conf.config)
  const deserialize = () => parseJson(serialized)

  return { ...conf, serialized, deserialize } as LoadConfigResult
}

describe('DiffEngine changed', () => {
  test('add theme.tokens', () => {
    const defaultConfig = (): Config => ({ ...fixtureDefaults.config })

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

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig), (conf) => {
      generator = new Generator({ ...conf, hooks: generator.hooks })
    })

    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "tokens/index.js",
        "tokens/tokens.d.ts",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
      [
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
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "newColor123",
          "colorPaletteRoots": [
            [
              "newColor123",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "",
            ],
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

    const changedAfterReset = diffEngine.refresh(createConfigResult(resetConfig))
    expect(generator.getArtifacts(changedAfterReset).changed).toMatchInlineSnapshot(`
      Set {
        "tokens/index.js",
        "tokens/tokens.d.ts",
      }
    `)
    expect(changedAfterReset.diffs).toMatchInlineSnapshot(`
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
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "newColor123",
          "colorPaletteRoots": [
            [
              "newColor123",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "",
            ],
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
    const defaultConfig = (): Config => ({ ...fixtureDefaults.config })

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
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "blue",
          "colorPaletteRoots": [
            [
              "blue",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "100",
            ],
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

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig))
    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "tokens/index.js",
        "tokens/tokens.d.ts",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
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
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "blue",
          "colorPaletteRoots": [
            [
              "blue",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "100",
            ],
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
    const defaultConfig = (): Config => ({ ...fixtureDefaults.config })

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

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig))
    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "recipes/index.js",
        "recipes/index.d.ts",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
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

    const changedAfterReset = diffEngine.refresh(createConfigResult(resetConfig))
    expect(generator.getArtifacts(changedAfterReset).changed).toMatchInlineSnapshot(`
      Set {
        "recipes/index.js",
        "recipes/index.d.ts",
      }
    `)
    expect(changedAfterReset.diffs).toMatchInlineSnapshot(`
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
    const defaultConfig = (): Config => ({ ...fixtureDefaults.config })

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

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig))
    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "recipes/index.js",
        "recipes/index.d.ts",
        "recipes/button-style.js",
        "recipes/button-style.dts",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
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
    const defaultConfig = (): Config => ({ ...fixtureDefaults.config })

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

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig))
    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "jsx/index.js",
        "jsx/index.d.ts",
        "patterns/index.js",
        "patterns/index.d.ts",
        "patterns/box.d.ts",
        "patterns/box.js",
        "patterns/flex.d.ts",
        "patterns/flex.js",
        "patterns/stack.d.ts",
        "patterns/stack.js",
        "patterns/vstack.d.ts",
        "patterns/vstack.js",
        "patterns/hstack.d.ts",
        "patterns/hstack.js",
        "patterns/spacer.d.ts",
        "patterns/spacer.js",
        "patterns/square.d.ts",
        "patterns/square.js",
        "patterns/circle.d.ts",
        "patterns/circle.js",
        "patterns/center.d.ts",
        "patterns/center.js",
        "patterns/link-overlay.d.ts",
        "patterns/link-overlay.js",
        "patterns/aspect-ratio.d.ts",
        "patterns/aspect-ratio.js",
        "patterns/grid.d.ts",
        "patterns/grid.js",
        "patterns/grid-item.d.ts",
        "patterns/grid-item.js",
        "patterns/wrap.d.ts",
        "patterns/wrap.js",
        "patterns/container.d.ts",
        "patterns/container.js",
        "patterns/divider.d.ts",
        "patterns/divider.js",
        "patterns/float.d.ts",
        "patterns/float.js",
        "patterns/bleed.d.ts",
        "patterns/bleed.js",
        "patterns/visually-hidden.d.ts",
        "patterns/visually-hidden.js",
        "patterns/cq.d.ts",
        "patterns/cq.js",
        "jsx/box.js",
        "jsx/box.d.ts",
        "jsx/flex.js",
        "jsx/flex.d.ts",
        "jsx/stack.js",
        "jsx/stack.d.ts",
        "jsx/vstack.js",
        "jsx/vstack.d.ts",
        "jsx/hstack.js",
        "jsx/hstack.d.ts",
        "jsx/spacer.js",
        "jsx/spacer.d.ts",
        "jsx/square.js",
        "jsx/square.d.ts",
        "jsx/circle.js",
        "jsx/circle.d.ts",
        "jsx/center.js",
        "jsx/center.d.ts",
        "jsx/link-overlay.js",
        "jsx/link-overlay.d.ts",
        "jsx/aspect-ratio.js",
        "jsx/aspect-ratio.d.ts",
        "jsx/grid.js",
        "jsx/grid.d.ts",
        "jsx/grid-item.js",
        "jsx/grid-item.d.ts",
        "jsx/wrap.js",
        "jsx/wrap.d.ts",
        "jsx/container.js",
        "jsx/container.d.ts",
        "jsx/divider.js",
        "jsx/divider.d.ts",
        "jsx/float.js",
        "jsx/float.d.ts",
        "jsx/bleed.js",
        "jsx/bleed.d.ts",
        "jsx/visually-hidden.js",
        "jsx/visually-hidden.d.ts",
        "jsx/cq.js",
        "jsx/cq.d.ts",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
      [
        {
          "path": [
            "patterns",
            "newPattern",
          ],
          "type": "CREATE",
          "value": {
            "transform": "transform() {
                      return { color: "blue.400" };
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

    const changedChangeTransform = diffEngine.refresh(createConfigResult(nextConfigChangeTransform))
    expect(generator.getArtifacts(changedChangeTransform).changed).toMatchInlineSnapshot(`
      Set {
        "jsx/index.js",
        "jsx/index.d.ts",
        "patterns/index.js",
        "patterns/index.d.ts",
        "patterns/box.d.ts",
        "patterns/box.js",
        "patterns/flex.d.ts",
        "patterns/flex.js",
        "patterns/stack.d.ts",
        "patterns/stack.js",
        "patterns/vstack.d.ts",
        "patterns/vstack.js",
        "patterns/hstack.d.ts",
        "patterns/hstack.js",
        "patterns/spacer.d.ts",
        "patterns/spacer.js",
        "patterns/square.d.ts",
        "patterns/square.js",
        "patterns/circle.d.ts",
        "patterns/circle.js",
        "patterns/center.d.ts",
        "patterns/center.js",
        "patterns/link-overlay.d.ts",
        "patterns/link-overlay.js",
        "patterns/aspect-ratio.d.ts",
        "patterns/aspect-ratio.js",
        "patterns/grid.d.ts",
        "patterns/grid.js",
        "patterns/grid-item.d.ts",
        "patterns/grid-item.js",
        "patterns/wrap.d.ts",
        "patterns/wrap.js",
        "patterns/container.d.ts",
        "patterns/container.js",
        "patterns/divider.d.ts",
        "patterns/divider.js",
        "patterns/float.d.ts",
        "patterns/float.js",
        "patterns/bleed.d.ts",
        "patterns/bleed.js",
        "patterns/visually-hidden.d.ts",
        "patterns/visually-hidden.js",
        "patterns/cq.d.ts",
        "patterns/cq.js",
        "jsx/box.js",
        "jsx/box.d.ts",
        "jsx/flex.js",
        "jsx/flex.d.ts",
        "jsx/stack.js",
        "jsx/stack.d.ts",
        "jsx/vstack.js",
        "jsx/vstack.d.ts",
        "jsx/hstack.js",
        "jsx/hstack.d.ts",
        "jsx/spacer.js",
        "jsx/spacer.d.ts",
        "jsx/square.js",
        "jsx/square.d.ts",
        "jsx/circle.js",
        "jsx/circle.d.ts",
        "jsx/center.js",
        "jsx/center.d.ts",
        "jsx/link-overlay.js",
        "jsx/link-overlay.d.ts",
        "jsx/aspect-ratio.js",
        "jsx/aspect-ratio.d.ts",
        "jsx/grid.js",
        "jsx/grid.d.ts",
        "jsx/grid-item.js",
        "jsx/grid-item.d.ts",
        "jsx/wrap.js",
        "jsx/wrap.d.ts",
        "jsx/container.js",
        "jsx/container.d.ts",
        "jsx/divider.js",
        "jsx/divider.d.ts",
        "jsx/float.js",
        "jsx/float.d.ts",
        "jsx/bleed.js",
        "jsx/bleed.d.ts",
        "jsx/visually-hidden.js",
        "jsx/visually-hidden.d.ts",
        "jsx/cq.js",
        "jsx/cq.d.ts",
      }
    `)
    expect(changedChangeTransform.diffs).toMatchInlineSnapshot(`
      [
        {
          "oldValue": "transform() {
                      return { color: "blue.400" };
                    }",
          "path": [
            "patterns",
            "newPattern",
            "transform",
          ],
          "type": "CHANGE",
          "value": "transform() {
                      return { color: "blue.500" };
                    }",
        },
      ]
    `)

    const resetConfig = mergeConfigs([{}, defaultConfig()])

    const changedAfterReset = diffEngine.refresh(createConfigResult(resetConfig))
    expect(generator.getArtifacts(changedAfterReset).changed).toMatchInlineSnapshot(`
      Set {
        "jsx/index.js",
        "jsx/index.d.ts",
        "patterns/index.js",
        "patterns/index.d.ts",
        "patterns/box.d.ts",
        "patterns/box.js",
        "patterns/flex.d.ts",
        "patterns/flex.js",
        "patterns/stack.d.ts",
        "patterns/stack.js",
        "patterns/vstack.d.ts",
        "patterns/vstack.js",
        "patterns/hstack.d.ts",
        "patterns/hstack.js",
        "patterns/spacer.d.ts",
        "patterns/spacer.js",
        "patterns/square.d.ts",
        "patterns/square.js",
        "patterns/circle.d.ts",
        "patterns/circle.js",
        "patterns/center.d.ts",
        "patterns/center.js",
        "patterns/link-overlay.d.ts",
        "patterns/link-overlay.js",
        "patterns/aspect-ratio.d.ts",
        "patterns/aspect-ratio.js",
        "patterns/grid.d.ts",
        "patterns/grid.js",
        "patterns/grid-item.d.ts",
        "patterns/grid-item.js",
        "patterns/wrap.d.ts",
        "patterns/wrap.js",
        "patterns/container.d.ts",
        "patterns/container.js",
        "patterns/divider.d.ts",
        "patterns/divider.js",
        "patterns/float.d.ts",
        "patterns/float.js",
        "patterns/bleed.d.ts",
        "patterns/bleed.js",
        "patterns/visually-hidden.d.ts",
        "patterns/visually-hidden.js",
        "patterns/cq.d.ts",
        "patterns/cq.js",
        "jsx/box.js",
        "jsx/box.d.ts",
        "jsx/flex.js",
        "jsx/flex.d.ts",
        "jsx/stack.js",
        "jsx/stack.d.ts",
        "jsx/vstack.js",
        "jsx/vstack.d.ts",
        "jsx/hstack.js",
        "jsx/hstack.d.ts",
        "jsx/spacer.js",
        "jsx/spacer.d.ts",
        "jsx/square.js",
        "jsx/square.d.ts",
        "jsx/circle.js",
        "jsx/circle.d.ts",
        "jsx/center.js",
        "jsx/center.d.ts",
        "jsx/link-overlay.js",
        "jsx/link-overlay.d.ts",
        "jsx/aspect-ratio.js",
        "jsx/aspect-ratio.d.ts",
        "jsx/grid.js",
        "jsx/grid.d.ts",
        "jsx/grid-item.js",
        "jsx/grid-item.d.ts",
        "jsx/wrap.js",
        "jsx/wrap.d.ts",
        "jsx/container.js",
        "jsx/container.d.ts",
        "jsx/divider.js",
        "jsx/divider.d.ts",
        "jsx/float.js",
        "jsx/float.d.ts",
        "jsx/bleed.js",
        "jsx/bleed.d.ts",
        "jsx/visually-hidden.js",
        "jsx/visually-hidden.d.ts",
        "jsx/cq.js",
        "jsx/cq.d.ts",
      }
    `)
    expect(changedAfterReset.diffs).toMatchInlineSnapshot(`
      [
        {
          "oldValue": {
            "transform": "transform() {
                      return { color: "blue.500" };
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
    const defaultConfig = (): Config => ({ ...fixtureDefaults.config })
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

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig))
    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "jsx/index.js",
        "jsx/index.d.ts",
        "patterns/index.js",
        "patterns/index.d.ts",
        "patterns/box.d.ts",
        "patterns/box.js",
        "patterns/flex.d.ts",
        "patterns/flex.js",
        "patterns/stack.d.ts",
        "patterns/stack.js",
        "patterns/vstack.d.ts",
        "patterns/vstack.js",
        "patterns/hstack.d.ts",
        "patterns/hstack.js",
        "patterns/spacer.d.ts",
        "patterns/spacer.js",
        "patterns/square.d.ts",
        "patterns/square.js",
        "patterns/circle.d.ts",
        "patterns/circle.js",
        "patterns/center.d.ts",
        "patterns/center.js",
        "patterns/link-overlay.d.ts",
        "patterns/link-overlay.js",
        "patterns/aspect-ratio.d.ts",
        "patterns/aspect-ratio.js",
        "patterns/grid.d.ts",
        "patterns/grid.js",
        "patterns/grid-item.d.ts",
        "patterns/grid-item.js",
        "patterns/wrap.d.ts",
        "patterns/wrap.js",
        "patterns/container.d.ts",
        "patterns/container.js",
        "patterns/divider.d.ts",
        "patterns/divider.js",
        "patterns/float.d.ts",
        "patterns/float.js",
        "patterns/bleed.d.ts",
        "patterns/bleed.js",
        "patterns/visually-hidden.d.ts",
        "patterns/visually-hidden.js",
        "patterns/cq.d.ts",
        "patterns/cq.js",
        "jsx/box.js",
        "jsx/box.d.ts",
        "jsx/flex.js",
        "jsx/flex.d.ts",
        "jsx/stack.js",
        "jsx/stack.d.ts",
        "jsx/vstack.js",
        "jsx/vstack.d.ts",
        "jsx/hstack.js",
        "jsx/hstack.d.ts",
        "jsx/spacer.js",
        "jsx/spacer.d.ts",
        "jsx/square.js",
        "jsx/square.d.ts",
        "jsx/circle.js",
        "jsx/circle.d.ts",
        "jsx/center.js",
        "jsx/center.d.ts",
        "jsx/link-overlay.js",
        "jsx/link-overlay.d.ts",
        "jsx/aspect-ratio.js",
        "jsx/aspect-ratio.d.ts",
        "jsx/grid.js",
        "jsx/grid.d.ts",
        "jsx/grid-item.js",
        "jsx/grid-item.d.ts",
        "jsx/wrap.js",
        "jsx/wrap.d.ts",
        "jsx/container.js",
        "jsx/container.d.ts",
        "jsx/divider.js",
        "jsx/divider.d.ts",
        "jsx/float.js",
        "jsx/float.d.ts",
        "jsx/bleed.js",
        "jsx/bleed.d.ts",
        "jsx/visually-hidden.js",
        "jsx/visually-hidden.d.ts",
        "jsx/cq.js",
        "jsx/cq.d.ts",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
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

  test('update syntax', () => {
    const defaultConfig = (): Config => ({ syntax: 'object-literal', ...fixtureDefaults.config })
    let generator = new Generator(createConfigResult(defaultConfig() as UserConfig))
    const diffEngine = new DiffEngine(generator)
    const nextConfig = mergeConfigs([
      {
        ...defaultConfig(),
        syntax: 'template-literal',
      },
    ])

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig), (conf) => {
      generator = new Generator({ ...conf, hooks: generator.hooks })
    })
    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "helpers.js",
        "css/index.js",
        "css/index.d.ts",
        "css/cva.js",
        "css/sva.js",
        "jsx/index.js",
        "jsx/index.d.ts",
        "jsx/is-valid-prop.js",
        "jsx/factory-helper.js",
        "patterns/index.js",
        "patterns/index.d.ts",
        "css/conditions.js",
        "css/css.js",
        "css/css.d.ts",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
      [
        {
          "oldValue": "object-literal",
          "path": [
            "syntax",
          ],
          "type": "CHANGE",
          "value": "template-literal",
        },
      ]
    `)
  })

  test('add themes', () => {
    const defaultConfig = (): Config => ({ ...fixtureDefaults.config })
    let generator = new Generator(createConfigResult(defaultConfig() as UserConfig))
    const diffEngine = new DiffEngine(generator)
    const nextConfig = mergeConfigs([
      {
        ...defaultConfig(),
        themes: {
          extend: {
            newTheme: {
              tokens: {
                colors: {
                  newColor123: { value: 'blue.100' },
                },
              },
            },
          },
        },
      },
    ])

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig), (conf) => {
      generator = new Generator({ ...conf, hooks: generator.hooks })
    })
    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "themes/index.js",
        "themes/index.d.ts",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
      [
        {
          "path": [
            "themes",
          ],
          "type": "CREATE",
          "value": {
            "newTheme": {
              "tokens": {
                "colors": {
                  "newColor123": {
                    "value": "blue.100",
                  },
                },
              },
            },
          },
        },
      ]
    `)
  })

  test('update plugins', () => {
    const defaultConfig = (): Config => ({ hash: true, syntax: 'template-literal', ...fixtureDefaults.config })
    const generator = new Generator(createConfigResult(defaultConfig() as UserConfig))
    const diffEngine = new DiffEngine(generator)
    const nextConfig = mergeConfigs([
      {
        ...defaultConfig(),
        hash: true,
        plugins: [
          {
            name: 'plugin123',
            hooks: {
              'utility:created': ({ configure }) => {
                configure({
                  toHash(paths, toHash) {
                    const stringConds = paths.join(':')
                    const splitConds = stringConds.split('_')
                    const hashConds = splitConds.map(toHash)
                    return hashConds.join('_')
                  },
                })
              },
            },
          },
        ],
      },
    ])

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig))
    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "recipes/create-recipe.js",
        "css/css.js",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
      [
        {
          "path": [
            "hooks",
          ],
          "type": "CREATE",
          "value": {
            "utility:created": "async (...a) => {
        for (const fn of fns) {
          await fn?.(...a);
        }
      }",
          },
        },
        {
          "path": [
            "plugins",
          ],
          "type": "CREATE",
          "value": [
            {
              "hooks": {
                "utility:created": "({ configure }) => {
                      configure({
                        toHash(paths, toHash) {
                          const stringConds = paths.join(":");
                          const splitConds = stringConds.split("_");
                          const hashConds = splitConds.map(toHash);
                          return hashConds.join("_");
                        }
                      });
                    }",
              },
              "name": "plugin123",
            },
          ],
        },
      ]
    `)
  })

  test('update separator', () => {
    const defaultConfig = (): Config => ({ ...fixtureDefaults.config })

    let generator = new Generator(createConfigResult(defaultConfig() as UserConfig))
    const diffEngine = new DiffEngine(generator)

    expect(generator.config.separator).toMatchInlineSnapshot(`"_"`)
    expect(generator.utility.separator).toMatchInlineSnapshot('"_"')
    expect(generator.recipes['separator']).toMatchInlineSnapshot('"_"')

    const nextConfig = {
      ...defaultConfig(),
      separator: '=',
    } as UserConfig

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig), (conf) => {
      generator = new Generator({ ...conf, hooks: generator.hooks })
    })

    expect(generator.config.separator).toMatchInlineSnapshot('"="')
    expect(generator.utility.separator).toMatchInlineSnapshot('"="')
    expect(generator.recipes['separator']).toMatchInlineSnapshot('"="')

    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot(`
      Set {
        "recipes/create-recipe.js",
        "css/css.js",
      }
    `)
    expect(diffResult.diffs).toMatchInlineSnapshot(`
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

  test('nothing changes', () => {
    const defaultConfig = (): Config => ({ ...fixtureDefaults.config })

    const config = defaultConfig() as UserConfig
    const generator = new Generator(createConfigResult(config))
    const diffEngine = new DiffEngine(generator)
    const nextConfig = mergeConfigs([{}, config, {}])

    const diffResult = diffEngine.refresh(createConfigResult(nextConfig))
    expect(generator.getArtifacts(diffResult).changed).toMatchInlineSnapshot('Set {}')
    expect(diffResult.diffs).toMatchInlineSnapshot('[]')

    const resetConfig = mergeConfigs([defaultConfig()])
    const changedAfterReset = diffEngine.refresh(createConfigResult(resetConfig))
    expect(generator.getArtifacts(changedAfterReset).changed).toMatchInlineSnapshot('Set {}')
    expect(diffResult.diffs).toMatchInlineSnapshot('[]')
  })
})
