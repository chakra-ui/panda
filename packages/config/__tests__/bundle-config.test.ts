import { describe, expect, test } from 'vitest'
import { bundle } from '../src/bundle'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

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
          "/samples/with-tsconfig-paths/panda.config.ts",
          "/samples/with-tsconfig-paths/src/theme/tokens.ts",
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
          "/samples/nested-files/panda.config.ts",
          "/samples/nested-files/src/index.ts",
          "/samples/nested-files/src/theme/index.ts",
          "/samples/nested-files/src/theme/tokens.ts",
          "/samples/nested-files/src/theme/colors.ts",
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
          "/samples/ts/panda.config.ts",
          "/samples/common/tokens.ts",
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
          "/samples/cts/panda.config.cts",
          "/samples/common/tokens.ts",
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
          "/samples/mts/panda.config.mts",
          "/samples/common/tokens.ts",
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
          "/samples/js/panda.config.js",
          "/samples/common/tokens.ts",
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
          "/samples/cjs/panda.config.cjs",
          "/samples/common/tokens.ts",
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
          "/samples/mjs/panda.config.mjs",
          "/samples/common/tokens.ts",
        ],
      }
    `)
  })
})
