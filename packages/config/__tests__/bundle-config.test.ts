import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { bundle } from '../src/bundle-config'

describe('bundle config', () => {
  const cwd = process.cwd()
  const _dirname = dirname(fileURLToPath(import.meta.url))

  // TODO test nested files dependencies + use files inside folders + use files with different extensions

  test('should bundle .ts config wits tsconfig path aliases', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/with-tsconfig-paths/panda.config.ts')
    const { config, dependencies } = await bundle(filePath, cwd)
    expect({ config, dependencies: dependencies.map((dep) => dep.replace(_dirname, '')) }).toMatchInlineSnapshot(`
      {
        "config": {
          "exclude": [],
          "hash": false,
          "include": [
            "./src/**/*.{ts,tsx,jsx}",
          ],
          "jsxFramework": "react",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
          ],
          "theme": {
            "extend": {
              "tokens": {
                "colors": {
                  "some-color": {
                    "value": "#2f81f7",
                  },
                },
              },
            },
          },
        },
        "dependencies": [
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/with-tsconfig-paths/src/theme/tokens.ts",
          "packages/config/__tests__/samples/with-tsconfig-paths/panda.config.ts",
        ],
      }
    `)
  })

  test('should bundle .ts config wits nested files and barrels', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/nested-files/panda.config.ts')
    const { config, dependencies } = await bundle(filePath, cwd)
    expect({ config, dependencies: dependencies.map((dep) => dep.replace(_dirname, '')) }).toMatchInlineSnapshot(`
      {
        "config": {
          "exclude": [],
          "hash": false,
          "include": [
            "./src/**/*.{ts,tsx,jsx}",
          ],
          "jsxFramework": "react",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
          ],
          "theme": {
            "extend": {
              "tokens": {
                "colors": {
                  "another-color": {
                    "value": "#76e3ea",
                  },
                },
              },
            },
          },
        },
        "dependencies": [
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/nested-files/src/theme/colors.ts",
          "packages/config/__tests__/samples/nested-files/src/theme/tokens.ts",
          "packages/config/__tests__/samples/nested-files/src/theme/index.ts",
          "packages/config/__tests__/samples/nested-files/src/index.ts",
          "packages/config/__tests__/samples/nested-files/panda.config.ts",
        ],
      }
    `)
  })

  test('should bundle .ts config with different preset loading methods', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/with-preset/panda.config.ts')
    const { config, dependencies } = await bundle(filePath, cwd)
    expect({ config, dependencies: dependencies.map((dep) => dep.replace(_dirname, '')) }).toMatchInlineSnapshot(`
      {
        "config": {
          "exclude": [],
          "hash": false,
          "include": [
            "./src/**/*.{ts,tsx,jsx}",
          ],
          "jsxFramework": "react",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
            {
              "theme": {
                "extend": {
                  "semanticTokens": {
                    "colors": {
                      "inverted": {
                        "default": {
                          "value": {
                            "_dark": "{colors.black}",
                            "base": "white",
                          },
                        },
                      },
                      "placeholder": {
                        "value": {
                          "_dark": "{colors.gray.400}",
                          "base": "{colors.gray.600}",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              "requiredPreset": {
                "theme": {
                  "extend": {
                    "semanticTokens": {
                      "colors": {
                        "muted": {
                          "value": {
                            "_dark": "{colors.gray.400}",
                            "base": "{colors.gray.500}",
                          },
                        },
                        "subtle": {
                          "value": {
                            "_dark": "{colors.gray.500}",
                            "base": "{colors.gray.400}",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
          "theme": {
            "extend": {
              "tokens": {
                "colors": {
                  "color-primary": {
                    "value": "#000",
                  },
                },
              },
            },
          },
        },
        "dependencies": [
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/with-preset/src/ts-import-preset.ts",
          "packages/config/__tests__/samples/with-preset/src/required-preset.ts",
          "packages/config/__tests__/samples/with-preset/panda.config.ts",
        ],
      }
    `)
  })

  test('should bundle .ts config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/ts/panda.config.ts')
    const { config, dependencies } = await bundle(filePath, cwd)
    expect({ config, dependencies: dependencies.map((dep) => dep.replace(_dirname, '')) }).toMatchInlineSnapshot(`
      {
        "config": {
          "exclude": [],
          "hash": false,
          "include": [
            "./src/**/*.{ts,tsx,jsx}",
          ],
          "jsxFramework": "react",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
          ],
          "theme": {
            "extend": {
              "tokens": {
                "fontSizes": {
                  "100xl": {
                    "value": "220px",
                  },
                  "some-size": {
                    "value": "clamp(.75rem, 1.5vw, 1rem)",
                  },
                },
              },
            },
          },
        },
        "dependencies": [
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/common/tokens.ts",
          "packages/config/__tests__/samples/ts/panda.config.ts",
        ],
      }
    `)
  })

  test('should bundle .cts config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/cts/panda.config.cts')
    const { config, dependencies } = await bundle(filePath, cwd)
    expect({ config, dependencies: dependencies.map((dep) => dep.replace(_dirname, '')) }).toMatchInlineSnapshot(`
      {
        "config": {
          "exclude": [],
          "hash": false,
          "include": [
            "./src/**/*.{ts,tsx,jsx}",
          ],
          "jsxFramework": "react",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
          ],
          "theme": {
            "extend": {
              "tokens": {
                "fontSizes": {
                  "100xl": {
                    "value": "220px",
                  },
                  "some-size": {
                    "value": "clamp(.75rem, 1.5vw, 1rem)",
                  },
                },
              },
            },
          },
        },
        "dependencies": [
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/common/tokens.ts",
          "packages/config/__tests__/samples/cts/panda.config.cts",
        ],
      }
    `)
  })

  test('should bundle .mts config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/mts/panda.config.mts')
    const { config, dependencies } = await bundle(filePath, cwd)
    expect({ config, dependencies: dependencies.map((dep) => dep.replace(_dirname, '')) }).toMatchInlineSnapshot(`
      {
        "config": {
          "exclude": [],
          "hash": false,
          "include": [
            "./src/**/*.{ts,tsx,jsx}",
          ],
          "jsxFramework": "react",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
          ],
          "theme": {
            "extend": {
              "tokens": {
                "fontSizes": {
                  "100xl": {
                    "value": "220px",
                  },
                  "some-size": {
                    "value": "clamp(.75rem, 1.5vw, 1rem)",
                  },
                },
              },
            },
          },
        },
        "dependencies": [
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/common/tokens.ts",
          "packages/config/__tests__/samples/mts/panda.config.mts",
        ],
      }
    `)
  })

  test('should bundle .js config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/js/panda.config.js')
    const { config, dependencies } = await bundle(filePath, cwd)
    expect({ config, dependencies: dependencies.map((dep) => dep.replace(_dirname, '')) }).toMatchInlineSnapshot(`
      {
        "config": {
          "exclude": [],
          "hash": false,
          "include": [
            "./src/**/*.{ts,tsx,jsx}",
          ],
          "jsxFramework": "react",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
          ],
          "theme": {
            "extend": {
              "tokens": {
                "fontSizes": {
                  "100xl": {
                    "value": "220px",
                  },
                  "some-size": {
                    "value": "clamp(.75rem, 1.5vw, 1rem)",
                  },
                },
              },
            },
          },
        },
        "dependencies": [
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/common/tokens.ts",
          "packages/config/__tests__/samples/js/panda.config.js",
        ],
      }
    `)
  })

  test('should bundle .cjs config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/cjs/panda.config.cjs')
    const { config, dependencies } = await bundle(filePath, cwd)
    expect({ config, dependencies: dependencies.map((dep) => dep.replace(_dirname, '')) }).toMatchInlineSnapshot(`
      {
        "config": {
          "exclude": [],
          "hash": false,
          "include": [
            "./src/**/*.{ts,tsx,jsx}",
          ],
          "jsxFramework": "react",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
          ],
          "theme": {
            "extend": {
              "tokens": {
                "fontSizes": {
                  "100xl": {
                    "value": "220px",
                  },
                  "some-size": {
                    "value": "clamp(.75rem, 1.5vw, 1rem)",
                  },
                },
              },
            },
          },
        },
        "dependencies": [
          "packages/cli/dist/index.js",
          "packages/config/__tests__/samples/common/tokens.ts",
          "packages/config/__tests__/samples/cjs/panda.config.cjs",
        ],
      }
    `)
  })

  test('should bundle .mjs config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/mjs/panda.config.mjs')
    const { config, dependencies } = await bundle(filePath, cwd)
    expect({ config, dependencies: dependencies.map((dep) => dep.replace(_dirname, '')) }).toMatchInlineSnapshot(`
      {
        "config": {
          "exclude": [],
          "hash": false,
          "include": [
            "./src/**/*.{ts,tsx,jsx}",
          ],
          "jsxFramework": "react",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
          ],
          "theme": {
            "extend": {
              "tokens": {
                "fontSizes": {
                  "100xl": {
                    "value": "220px",
                  },
                  "some-size": {
                    "value": "clamp(.75rem, 1.5vw, 1rem)",
                  },
                },
              },
            },
          },
        },
        "dependencies": [
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/common/tokens.ts",
          "packages/config/__tests__/samples/mjs/panda.config.mjs",
        ],
      }
    `)
  })
})
