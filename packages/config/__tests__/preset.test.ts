import type { Config, Preset } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { resolveAuthoredPresets } from '../src/preset'

const defineConfig = <T extends Config>(config: T) => config
const definePreset = <T extends Preset>(preset: T) => preset

async function resolve(config: Config) {
  return (await resolveAuthoredPresets(config as any, '/project')).config as any
}

describe('resolveAuthoredPresets / precedence', () => {
  test('merges preset base, preset extend, user base, and user extend in priority order', async () => {
    const result = await resolve(
      defineConfig({
        presets: [
          definePreset({
            name: 'preset-a',
            theme: {
              tokens: {
                colors: {
                  brand: { value: 'preset-a-base' },
                  baseOnly: { value: 'preset-a-base' },
                },
              },
              extend: {
                tokens: {
                  colors: {
                    accent: { value: 'preset-a-extend' },
                    shared: { value: 'preset-a-extend' },
                  },
                },
              },
            },
          }),
          definePreset({
            name: 'preset-b',
            theme: {
              tokens: {
                colors: {
                  shared: { value: 'preset-b-base' },
                  presetB: { value: 'preset-b-base' },
                },
              },
              extend: {
                tokens: {
                  colors: {
                    accent: { value: 'preset-b-extend' },
                    presetBExtend: { value: 'preset-b-extend' },
                  },
                },
              },
            },
          }),
        ],
        theme: {
          tokens: {
            colors: {
              brand: { value: 'user-base' },
            },
          },
          extend: {
            tokens: {
              colors: {
                accent: { value: 'user-extend' },
                userOnly: { value: 'user-extend' },
              },
            },
          },
        },
      }),
    )

    expect(result.theme.tokens.colors).toMatchInlineSnapshot(`
      {
        "accent": {
          "value": "user-extend",
        },
        "baseOnly": {
          "value": "preset-a-base",
        },
        "brand": {
          "value": "user-base",
        },
        "presetB": {
          "value": "preset-b-base",
        },
        "presetBExtend": {
          "value": "preset-b-extend",
        },
        "shared": {
          "value": "preset-b-base",
        },
        "userOnly": {
          "value": "user-extend",
        },
      }
    `)
  })

  test('resolves nested presets depth-first and preserves sibling order', async () => {
    const result = await resolve(
      defineConfig({
        presets: [
          definePreset({
            name: 'outer',
            presets: [
              definePreset({
                name: 'inner-a',
                theme: {
                  extend: {
                    tokens: {
                      colors: {
                        fromInnerA: { value: 'inner-a' },
                        innerSiblingWins: { value: 'inner-a' },
                        parentWins: { value: 'inner-a' },
                        siblingWins: { value: 'inner-a' },
                      },
                    },
                  },
                },
              }),
              definePreset({
                name: 'inner-b',
                theme: {
                  extend: {
                    tokens: {
                      colors: {
                        fromInnerB: { value: 'inner-b' },
                        innerSiblingWins: { value: 'inner-b' },
                      },
                    },
                  },
                },
              }),
            ],
            theme: {
              tokens: {
                colors: {
                  fromOuter: { value: 'outer' },
                  parentWins: { value: 'outer' },
                  siblingWins: { value: 'outer' },
                },
              },
            },
          }),
          definePreset({
            name: 'sibling',
            theme: {
              extend: {
                tokens: {
                  colors: {
                    fromSibling: { value: 'sibling' },
                    siblingWins: { value: 'sibling' },
                  },
                },
              },
            },
          }),
        ],
      }),
    )

    expect(result.theme.tokens.colors).toMatchInlineSnapshot(`
      {
        "fromInnerA": {
          "value": "inner-a",
        },
        "fromInnerB": {
          "value": "inner-b",
        },
        "fromOuter": {
          "value": "outer",
        },
        "fromSibling": {
          "value": "sibling",
        },
        "innerSiblingWins": {
          "value": "inner-b",
        },
        "parentWins": {
          "value": "outer",
        },
        "siblingWins": {
          "value": "sibling",
        },
      }
    `)
  })

  test('awaits async presets before applying user overrides', async () => {
    const result = await resolve(
      defineConfig({
        presets: [
          Promise.resolve(
            definePreset({
              name: 'async-preset',
              theme: {
                extend: {
                  tokens: {
                    spacing: {
                      1: { value: '4px' },
                      shared: { value: 'from-async' },
                    },
                  },
                },
              },
            }),
          ),
        ],
        theme: {
          tokens: {
            spacing: {
              shared: { value: 'from-user' },
            },
          },
        },
      }),
    )

    expect(result.theme.tokens.spacing).toMatchInlineSnapshot(`
      {
        "1": {
          "value": "4px",
        },
        "shared": {
          "value": "from-user",
        },
      }
    `)
  })
})

describe('resolveAuthoredPresets / section coverage', () => {
  test('folds extend across all resolver-owned config sections', async () => {
    const result = await resolve(
      defineConfig({
        presets: [
          definePreset({
            name: 'sections',
            conditions: {
              hover: '&:hover',
              extend: { focus: '&:focus' },
            },
            utilities: {
              color: { className: 'c', values: 'colors' },
              extend: {
                bg: { className: 'bg', values: 'colors', property: 'backgroundColor' },
              },
            },
            patterns: {
              stack: { properties: { gap: { type: 'token', value: 'spacing' } } },
              extend: {
                cluster: {
                  properties: {
                    gap: { type: 'token', value: 'spacing' },
                    justify: { type: 'property', value: 'justifyContent' },
                  },
                },
              },
            },
            globalCss: {
              body: { margin: 0 },
              extend: {
                html: { color: 'red' },
              },
            },
            globalVars: {
              '--preset': '1',
              extend: {
                '--extended': '2',
              },
            },
            globalFontface: {
              Inter: { src: 'url(inter.woff2)' },
              extend: {
                Mono: { src: 'url(mono.woff2)' },
              },
            },
            globalPositionTry: {
              tooltip: { top: '0' },
              extend: {
                popover: { bottom: '0' },
              },
            },
            staticCss: {
              css: [{ properties: { color: ['red'] } }],
              extend: {
                recipes: { badge: ['*'] },
              },
            },
            themes: {
              light: { tokens: { colors: { bg: { value: 'white' } } } },
              extend: {
                dark: { tokens: { colors: { bg: { value: 'black' } } } },
              },
            },
            theme: {
              recipes: {
                badge: { className: 'badge', base: { color: 'red' } },
              },
              slotRecipes: {
                card: { className: 'card', slots: ['root'], base: { root: { p: '2' } } },
              },
              extend: {
                tokens: {
                  colors: {
                    brand: { value: '#123456' },
                  },
                },
              },
            },
          }),
        ],
        conditions: {
          hover: '&[data-hover]',
          extend: { active: '&:active' },
        },
      }),
    )

    expect({
      conditions: result.conditions,
      utilities: result.utilities,
      patterns: result.patterns,
      globalCss: result.globalCss,
      globalVars: result.globalVars,
      globalFontface: result.globalFontface,
      globalPositionTry: result.globalPositionTry,
      staticCss: result.staticCss,
      themes: result.themes,
      theme: result.theme,
    }).toMatchInlineSnapshot(`
      {
        "conditions": {
          "active": "&:active",
          "focus": "&:focus",
          "hover": "&[data-hover]",
        },
        "globalCss": {
          "body": {
            "margin": 0,
          },
          "html": {
            "color": "red",
          },
        },
        "globalFontface": {
          "Inter": {
            "src": "url(inter.woff2)",
          },
          "Mono": {
            "src": "url(mono.woff2)",
          },
        },
        "globalPositionTry": {
          "popover": {
            "bottom": "0",
          },
          "tooltip": {
            "top": "0",
          },
        },
        "globalVars": {
          "--extended": "2",
          "--preset": "1",
        },
        "patterns": {
          "cluster": {
            "properties": {
              "gap": {
                "type": "token",
                "value": "spacing",
              },
              "justify": {
                "type": "property",
                "value": "justifyContent",
              },
            },
          },
          "stack": {
            "properties": {
              "gap": {
                "type": "token",
                "value": "spacing",
              },
            },
          },
        },
        "staticCss": {
          "css": [
            {
              "properties": {
                "color": [
                  "red",
                ],
              },
            },
          ],
          "recipes": {
            "badge": [
              "*",
            ],
          },
        },
        "theme": {
          "recipes": {
            "badge": {
              "base": {
                "color": "red",
              },
              "className": "badge",
            },
          },
          "slotRecipes": {
            "card": {
              "base": {
                "root": {
                  "p": "2",
                },
              },
              "className": "card",
              "slots": [
                "root",
              ],
            },
          },
          "tokens": {
            "colors": {
              "brand": {
                "value": "#123456",
              },
            },
          },
        },
        "themes": {
          "dark": {
            "tokens": {
              "colors": {
                "bg": {
                  "value": "black",
                },
              },
            },
          },
          "light": {
            "tokens": {
              "colors": {
                "bg": {
                  "value": "white",
                },
              },
            },
          },
        },
        "utilities": {
          "bg": {
            "className": "bg",
            "property": "backgroundColor",
            "values": "colors",
          },
          "color": {
            "className": "c",
            "values": "colors",
          },
        },
      }
    `)
  })

  test('replaces base arrays and concatenates extend arrays', async () => {
    const result = await resolve(
      defineConfig({
        presets: [
          definePreset({
            name: 'preset-a',
            theme: { containerNames: ['preset-a'] },
            staticCss: { recipes: { badge: [{ size: ['sm'] }] } },
          }),
          definePreset({
            name: 'preset-b',
            theme: {
              containerNames: ['preset-b'],
              extend: { containerNames: ['preset-b-extend'] },
            },
            staticCss: {
              recipes: { badge: [{ variant: ['solid'] }] },
              extend: { recipes: { badge: [{ state: ['hover'] }] } },
            },
          }),
        ],
        theme: {
          extend: { containerNames: ['user-extend'] },
        },
        staticCss: {
          extend: { recipes: { badge: [{ condition: ['md'] }] } },
        },
      }),
    )

    expect({
      containerNames: result.theme.containerNames,
      staticRecipe: result.staticCss.recipes.badge,
    }).toMatchInlineSnapshot(`
      {
        "containerNames": [
          "preset-b",
          "preset-b-extend",
          "user-extend",
        ],
        "staticRecipe": [
          {
            "variant": [
              "solid",
            ],
          },
          {
            "state": [
              "hover",
            ],
          },
          {
            "condition": [
              "md",
            ],
          },
        ],
      }
    `)
  })

  test('concatenates staticCss.extend.patterns across presets and user config', async () => {
    const result = await resolve(
      defineConfig({
        presets: [
          definePreset({
            name: 'preset-a',
            staticCss: {
              patterns: { stack: [{ properties: { gap: ['4'] } }] },
            },
          }),
          definePreset({
            name: 'preset-b',
            staticCss: {
              extend: {
                patterns: { stack: [{ properties: { gap: ['8'] } }] },
              },
            },
          }),
        ],
        staticCss: {
          extend: {
            patterns: { circle: [{ properties: { size: ['40px'] } }] },
          },
        },
      }),
    )

    expect(result.staticCss.patterns).toMatchInlineSnapshot(`
      {
        "circle": [
          {
            "properties": {
              "size": [
                "40px",
              ],
            },
          },
        ],
        "stack": [
          {
            "properties": {
              "gap": [
                "4",
              ],
            },
          },
          {
            "properties": {
              "gap": [
                "8",
              ],
            },
          },
        ],
      }
    `)
  })
})

describe('resolveAuthoredPresets / token normalization', () => {
  test('moves flat token metadata to DEFAULT when nested token values are merged in', async () => {
    const result = await resolve(
      defineConfig({
        presets: [
          definePreset({
            name: 'flat-token',
            theme: {
              extend: {
                tokens: {
                  colors: {
                    black: {
                      value: '#000',
                      description: 'black default',
                      deprecated: 'use gray.950',
                      extensions: { source: 'preset' },
                    },
                  },
                },
              },
            },
          }),
        ],
        theme: {
          tokens: {
            colors: {
              black: {
                50: { value: '#fafafa' },
                950: { value: '#030303' },
              },
            },
          },
        },
      }),
    )

    expect(result.theme.tokens.colors.black).toMatchInlineSnapshot(`
      {
        "50": {
          "value": "#fafafa",
        },
        "950": {
          "value": "#030303",
        },
        "DEFAULT": {
          "deprecated": "use gray.950",
          "description": "black default",
          "extensions": {
            "source": "preset",
          },
          "value": "#000",
        },
      }
    `)
  })

  test('preserves an existing DEFAULT token value', async () => {
    const result = await resolve(
      defineConfig({
        presets: [
          definePreset({
            name: 'flat-token',
            theme: {
              extend: {
                tokens: {
                  colors: {
                    black: { value: '#000' },
                  },
                },
              },
            },
          }),
        ],
        theme: {
          tokens: {
            colors: {
              black: {
                DEFAULT: { value: '#111' },
                950: { value: '#030303' },
              },
            },
          },
        },
      }),
    )

    expect(result.theme.tokens.colors.black).toMatchInlineSnapshot(`
      {
        "950": {
          "value": "#030303",
        },
        "DEFAULT": {
          "value": "#111",
        },
      }
    `)
  })
})

describe('resolveAuthoredPresets / runtime keys and unsafe keys', () => {
  test('strips top-level runtime-only keys while preserving nested token names', async () => {
    const result = await resolve(
      defineConfig({
        name: 'user-config',
        extend: { outdir: 'ignored' },
        plugins: [
          {
            name: 'ignored-plugin',
            hooks: {
              'parser:before': ({ content }) => content,
            },
          },
        ],
        presets: [
          definePreset({
            name: 'preset',
            theme: {
              tokens: {
                colors: {
                  name: { value: 'nested-name-token' },
                  presets: { value: 'nested-presets-token' },
                },
              },
            },
          }),
        ],
      }),
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "theme": {
          "tokens": {
            "colors": {
              "name": {
                "value": "nested-name-token",
              },
              "presets": {
                "value": "nested-presets-token",
              },
            },
          },
        },
      }
    `)
  })

  test('ignores prototype pollution keys during merge', async () => {
    const result = await resolve(
      defineConfig({
        theme: {
          tokens: {
            colors: {
              safe: { value: 'ok' },
              ['__proto__']: { polluted: { value: 'bad' } },
              constructor: { polluted: { value: 'bad' } },
              prototype: { polluted: { value: 'bad' } },
            },
          },
        },
      } as any),
    )

    expect({
      colors: result.theme.tokens.colors,
      polluted: ({} as any).polluted,
    }).toMatchInlineSnapshot(`
      {
        "colors": {
          "safe": {
            "value": "ok",
          },
        },
        "polluted": undefined,
      }
    `)
  })
})

describe('resolveAuthoredPresets / errors', () => {
  test('rejects non-object presets', async () => {
    await expect(resolveAuthoredPresets({ presets: [42 as any] } as any, '/project')).rejects.toThrow(
      /Preset "unknown-preset" must resolve to an object/,
    )
  })

  test('rejects async presets that resolve to non-objects', async () => {
    await expect(
      resolveAuthoredPresets({ presets: [Promise.resolve(null) as any] } as any, '/project'),
    ).rejects.toThrow(/Preset "unknown-preset" must resolve to an object/)
  })

  test('wraps rejected async presets', async () => {
    await expect(
      resolveAuthoredPresets({ presets: [Promise.reject(new Error('boom')) as any] } as any, '/project'),
    ).rejects.toThrow(/Failed to resolve preset "unknown-preset": boom/)
  })

  test('attaches diagnostics to rejected async presets', async () => {
    await expect(
      resolveAuthoredPresets({ presets: [Promise.reject(new Error('boom')) as any] } as any, '/project'),
    ).rejects.toMatchObject({
      diagnostics: [{ code: 'preset_resolution_failed', severity: 'error', category: 'config' }],
    })
  })

  test('rejects circular object preset graphs', async () => {
    const preset = definePreset({ name: 'cycle' } as any)
    ;(preset as any).presets = [preset]

    await expect(resolveAuthoredPresets({ presets: [preset] } as any, '/project')).rejects.toThrow(
      /Circular preset dependency detected/,
    )
  })

  test('rejects non-object extend values with the section path', async () => {
    await expect(
      resolveAuthoredPresets(
        {
          presets: [
            definePreset({
              name: 'bad-extend',
              utilities: { extend: [] } as any,
            }),
          ],
        } as any,
        '/project',
      ),
    ).rejects.toThrow(/Config section `utilities\.extend` must be an object/)
  })
})
