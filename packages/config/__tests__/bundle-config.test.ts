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
          "name": "__panda.config__",
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
          "packages/shared/dist/index.mjs",
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/with-tsconfig-paths/src/theme/tokens.ts",
          "packages/config/__tests__/samples/with-tsconfig-paths/panda.config.ts",
        ],
      }
    `)
  })

  test('should resolve path aliases from referenced tsconfig (Vite solution-style, config at root)', async () => {
    const sampleCwd = path.resolve(_dirname, './samples/solution-tsconfig-paths')
    const filePath = path.join(sampleCwd, 'panda.config.ts')
    const { config, dependencies } = await bundle(filePath, sampleCwd)

    expect(config).toMatchObject({
      theme: {
        extend: {
          tokens: {
            colors: {
              brand: { value: '#2f81f7' },
            },
          },
        },
      },
    })
    expect(dependencies.some((dep) => dep.endsWith('src/theme/tokens.ts'))).toBe(true)
  })

  test('should resolve path aliases from referenced tsconfig when config is under src/', async () => {
    const sampleCwd = path.resolve(_dirname, './samples/solution-tsconfig-paths-src')
    const filePath = path.join(sampleCwd, 'src/panda.config.ts')
    const { config, dependencies } = await bundle(filePath, sampleCwd)

    expect(config).toMatchObject({
      theme: {
        extend: {
          tokens: {
            colors: {
              accent: { value: '#76e3ea' },
            },
          },
        },
      },
    })
    expect(dependencies.some((dep) => dep.endsWith('src/theme/tokens.ts'))).toBe(true)
  })

  test('should resolve path aliases used by transitive config imports', async () => {
    const sampleCwd = path.resolve(_dirname, './samples/solution-tsconfig-paths-transitive')
    const filePath = path.join(sampleCwd, 'panda.config.ts')
    const { config, dependencies } = await bundle(filePath, sampleCwd)

    expect(config).toMatchObject({
      theme: {
        extend: {
          tokens: {
            colors: {
              transitive: { value: '#ff00aa' },
            },
          },
        },
      },
    })
    expect(dependencies.some((dep) => dep.endsWith('theme.ts'))).toBe(true)
    expect(dependencies.some((dep) => dep.endsWith('src/theme/tokens.ts'))).toBe(true)
  })

  test('should resolve path aliases inherited via tsconfig extends', async () => {
    const sampleCwd = path.resolve(_dirname, './samples/solution-tsconfig-paths-extends')
    const filePath = path.join(sampleCwd, 'panda.config.ts')
    const { config, dependencies } = await bundle(filePath, sampleCwd)

    expect(config).toMatchObject({
      theme: {
        extend: {
          tokens: {
            colors: {
              viaExtends: { value: '#00b894' },
            },
          },
        },
      },
    })
    expect(dependencies.some((dep) => dep.endsWith('src/theme/tokens.ts'))).toBe(true)
  })

  test('should prefer owning project paths over an earlier referenced project with different paths', async () => {
    // Vite order: app first (~/*), node second (@node/*). Config is owned by node.
    const sampleCwd = path.resolve(_dirname, './samples/solution-tsconfig-paths-multi')
    const filePath = path.join(sampleCwd, 'panda.config.ts')
    const { config, dependencies } = await bundle(filePath, sampleCwd)

    expect(config).toMatchObject({
      theme: {
        extend: {
          tokens: {
            colors: {
              fromNode: { value: '#6c5ce7' },
            },
          },
        },
      },
    })
    expect(dependencies.some((dep) => dep.endsWith('node-lib/tokens.ts'))).toBe(true)
  })

  test('should not fall back to another project when the owning project already defines paths', async () => {
    // Owned by node (@node/*). App has ~/*, but we do not merge path maps.
    const sampleCwd = path.resolve(_dirname, './samples/solution-tsconfig-paths-multi')
    const filePath = path.join(sampleCwd, 'panda.config.app-alias.ts')

    await expect(bundle(filePath, sampleCwd)).rejects.toThrow(/Could not resolve "~\/theme\/tokens"/)
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
          "name": "__panda.config__",
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
          "packages/shared/dist/index.mjs",
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
          "name": "__panda.config__",
          "preflight": true,
          "presets": [
            "@pandacss/dev/presets",
            {
              "name": "ts-import-preset",
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
                "name": "required-preset",
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
          "packages/shared/dist/index.mjs",
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
          "name": "__panda.config__",
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
          "packages/shared/dist/index.mjs",
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
          "name": "__panda.config__",
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
          "packages/shared/dist/index.mjs",
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
          "name": "__panda.config__",
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
          "packages/shared/dist/index.mjs",
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
          "name": "__panda.config__",
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
          "packages/shared/dist/index.mjs",
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
          "name": "__panda.config__",
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
          "packages/shared/dist/index.js",
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
          "name": "__panda.config__",
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
          "packages/shared/dist/index.mjs",
          "packages/cli/dist/index.mjs",
          "packages/config/__tests__/samples/common/tokens.ts",
          "packages/config/__tests__/samples/mjs/panda.config.mjs",
        ],
      }
    `)
  })
})
