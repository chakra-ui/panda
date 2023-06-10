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
    expect(await bundle(filePath, cwd)).toMatchInlineSnapshot(`
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
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/with-tsconfig-paths/panda.config.ts",
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/with-tsconfig-paths/src/theme/tokens.ts",
        ],
      }
    `)
  })

  test('should bundle .ts config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/ts/panda.config.ts')
    expect(await bundle(filePath, cwd)).toMatchInlineSnapshot(`
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
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/ts/panda.config.ts",
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/common/tokens.ts",
        ],
      }
    `)
  })

  test('should bundle .cts config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/cts/panda.config.cts')
    expect(await bundle(filePath, cwd)).toMatchInlineSnapshot(`
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
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/cts/panda.config.cts",
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/common/tokens.ts",
        ],
      }
    `)
  })

  test('should bundle .mts config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/mts/panda.config.mts')
    expect(await bundle(filePath, cwd)).toMatchInlineSnapshot(`
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
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/mts/panda.config.mts",
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/common/tokens.ts",
        ],
      }
    `)
  })

  test('should bundle .js config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/js/panda.config.js')
    expect(await bundle(filePath, cwd)).toMatchInlineSnapshot(`
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
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/js/panda.config.js",
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/common/tokens.ts",
        ],
      }
    `)
  })

  test('should bundle .cjs config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/cjs/panda.config.cjs')
    expect(await bundle(filePath, cwd)).toMatchInlineSnapshot(`
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
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/cjs/panda.config.cjs",
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/common/tokens.ts",
        ],
      }
    `)
  })

  test('should bundle .mjs config', async () => {
    const filePath = path.resolve(cwd, _dirname, './samples/mjs/panda.config.mjs')
    expect(await bundle(filePath, cwd)).toMatchInlineSnapshot(`
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
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/mjs/panda.config.mjs",
          "/Users/astahmer/dev/open-source/panda/packages/config/__tests__/samples/common/tokens.ts",
        ],
      }
    `)
  })
})
