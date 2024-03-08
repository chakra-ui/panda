import type { UserConfig } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { validateConfig } from '../src/validate-config'

describe('validateConfig', () => {
  test('should not throw when no errors', () => {
    const config: Partial<UserConfig> = {
      theme: {
        breakpoints: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
        },
        tokens: {
          colors: {
            primary: { value: '#000', type: 'color', description: 'The primary color' },
            secondary: { value: '#fff' },
            tertiary: {
              value: '#ddd',
              type: 'color',
              description: 'gray.100',
              extensions: {
                category: 'colors',
                type: 'primitive',
              },
            },
          },
          fontSizes: {
            sm: { value: '12px' },
            md: { value: '16px' },
            lg: { value: '20px' },
          },
        },
        semanticTokens: {
          colors: {
            bg: { value: '{colors.primary}' },
          },
          fontSizes: {
            main: { value: '{fontSizes.md}' },
          },
        },
      },
      conditions: {
        dark: '@media (prefers-color-scheme: dark)',
        pinkTheme: '&[data-theme="pink"]',
      },
      patterns: {
        'btn-primary': {},
      },
    }

    expect(() => validateConfig(config)).not.toThrow()
  })

  test('should throw with validation: error', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        breakpoints: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
        },
        tokens: {
          colors: {
            primary: { value: '#000' },
            // @ts-expect-error should be an object with { value }
            secondary: '#fff',
          },
          fontSizes: {
            sm: { value: '12px' },
            md: { value: '16px' },
            lg: { value: '20px' },
          },
        },
        semanticTokens: {
          colors: {
            bg: { value: '{colors.primary}' },
          },
          fontSizes: {
            main: { value: '{fontSizes.md}' },
          },
        },
      },
      conditions: {
        dark: '@media (prefers-color-scheme: dark)',
        pinkTheme: '&[data-theme="pink"]',
      },
      patterns: {
        'btn-primary': {},
      },
    }

    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [tokens] Token must contain 'value': \`theme.tokens.colors.secondary\`
      ]
    `,
    )
  })

  test('should not throw with validation: warn', () => {
    const config: Partial<UserConfig> = {
      validation: 'warn',
      theme: {
        breakpoints: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
        },
        tokens: {
          colors: {
            primary: { value: '#000' },
            // @ts-expect-error should be an object with { value }
            secondary: '#fff',
          },
          fontSizes: {
            sm: { value: '12px' },
            md: { value: '16px' },
            lg: { value: '20px' },
          },
        },
        semanticTokens: {
          colors: {
            bg: { value: '{colors.primary}' },
          },
          fontSizes: {
            main: { value: '{fontSizes.md}' },
          },
        },
      },
      conditions: {
        dark: '@media (prefers-color-scheme: dark)',
        pinkTheme: '&[data-theme="pink"]',
      },
      patterns: {
        'btn-primary': {},
      },
    }

    expect(() => validateConfig(config)).not.toThrow()
  })

  test('should report errors on validation warn - altogether', () => {
    const config: Partial<UserConfig> = {
      validation: 'warn',
      theme: {
        breakpoints: {
          sm: '640em', // invalid unit
          md: '768px',
          lg: '1024px',
        },
        tokens: {
          colors: {
            primary: { value: '#000' },
            // @ts-expect-error should be an object with { value }
            secondary: '#fff',
            group: {
              with: {
                nested: {
                  value: 'red',
                },
                // @ts-expect-error should be an object with { value }
                invalid: 'blue',
              },
            },
          },
          fontSizes: {
            sm: { value: '12px' },
            md: { value: '16px' },
            lg: { value: '20px' },
          },
        },
        semanticTokens: {
          colors: {
            bg: { value: '{colors.secondary}' },
            primary: { value: '{colors.bg}' }, // clashing name (already exists in tokens)
            another: {
              group: {
                ok: {
                  value: '{colors.group.with.nested}',
                },
                stillok: {
                  value: {
                    base: 'blue',
                    _hover: 'green',
                    _active: '{colors.doesntexist}', // invalid missing reference
                  },
                },
                // @ts-expect-error  should be an object with { value }
                invalid: '{colors.group.with.invalid}',
                recursive: {
                  value: '{colors.another.circular}', // invalid circular reference
                },
                missing: {
                  value: '{colors.missing}', // invalid missing reference
                },
              },
              self: {
                value: '{colors.another.self}', // invalid self reference
              },
              circular: {
                value: '{colors.another.group.recursive}', // invalid circular reference
              },
            },
          },
          fontSizes: {
            main: { value: '{fontSizes.md2}' }, // invalid reference
          },
        },
        recipes: {
          stack: {
            // clashing name (already exists in patterns)
            className: 'stack',
          },
        },
        slotRecipes: {
          'btn-primary': {
            // clashing name (already exists in patterns)
            className: 'btn-primary',
            slots: [],
          },
        },
      },
      conditions: {
        dark: '@media (prefers-color-scheme: dark)',
        pinkTheme: '[data-theme="pink"]', // invalid selector (must contain '&')
      },
      patterns: {
        'btn-primary': {},
      },
    }

    expect(validateConfig(config)).toMatchInlineSnapshot(`
      Set {
        "[breakpoints] All breakpoints must use the same unit: \`640em, 768px, 1024px\`",
        "[conditions] Selectors should contain the \`&\` character: \`[data-theme="pink"]\`",
        "[tokens] Token must contain 'value': \`theme.tokens.colors.secondary\`",
        "[tokens] Token must contain 'value': \`theme.tokens.colors.group.with.invalid\`",
        "[tokens] Token must contain 'value': \`theme.semanticTokens.colors.another.group.invalid\`",
        "[tokens] Missing token: \`colors.doesntexist\` used in \`config.semanticTokens.colors.another.group.stillok\`",
        "[tokens] Circular token reference: \`colors.another.group.recursive\` -> \`colors.another.circular\` -> ... -> \`colors.another.group.recursive\`",
        "[tokens] Missing token: \`colors.missing\` used in \`config.semanticTokens.colors.another.group.missing\`",
        "[tokens] Self token reference: \`colors.another.self\`",
        "[tokens] Circular token reference: \`colors.another.self\` -> \`colors.another.self\` -> ... -> \`colors.another.self\`",
        "[tokens] Circular token reference: \`colors.another.circular\` -> \`colors.another.group.recursive\` -> ... -> \`colors.another.circular\`",
        "[tokens] Missing token: \`fontSizes.md2\` used in \`config.semanticTokens.fontSizes.main\`",
        "[recipes] This recipe name is already used in \`config.patterns\`: btn-primary",
      }
    `)
  })

  test('should report error if breakpoints use different units', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        breakpoints: {
          sm: '640em', // invalid unit
          md: '768px',
          lg: '1024px',
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [breakpoints] All breakpoints must use the same unit: \`640em, 768px, 1024px\`
      ]
    `,
    )
  })

  test('should report error for condition selectors without & character', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      conditions: {
        pinkTheme: '[data-theme="pink"]', // invalid selector
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [conditions] Selectors should contain the \`&\` character: \`[data-theme="pink"]\`
      ]
    `,
    )
  })

  test('should report error for token paths not ending with value', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        tokens: {
          colors: {
            // @ts-expect-error should be an object with { value }
            secondary: '#fff',
          },
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [tokens] Token must contain 'value': \`theme.tokens.colors.secondary\`
      ]
    `,
    )
  })

  test('should report error for semantic token paths not containing value', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        semanticTokens: {
          colors: {
            // @ts-expect-error should be an object with { value }
            invalid: '{colors.group.with.invalid}',
          },
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [tokens] Token must contain 'value': \`theme.semanticTokens.colors.invalid\`
      ]
    `,
    )
  })

  test('should report error for missing token references', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        semanticTokens: {
          colors: {
            another: {
              group: {
                stillok: {
                  value: {
                    _active: '{colors.doesntexist}', // invalid missing reference
                  },
                },
              },
            },
          },
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [tokens] Missing token: \`colors.doesntexist\` used in \`config.semanticTokens.colors.another.group.stillok\`
      ]
    `,
    )
  })

  test('should report error for circular token references', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        semanticTokens: {
          colors: {
            another: {
              circular: {
                value: '{colors.another.group.recursive}',
              },
              group: {
                recursive: {
                  value: '{colors.another.circular}',
                },
              },
            },
          },
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [tokens] Circular token reference: \`colors.another.circular\` -> \`colors.another.group.recursive\` -> ... -> \`colors.another.circular\`
      - [tokens] Circular token reference: \`colors.another.group.recursive\` -> \`colors.another.circular\` -> ... -> \`colors.another.group.recursive\`
      ]
    `,
    )
  })

  test('should report error for self token references', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        semanticTokens: {
          colors: {
            another: {
              self: {
                value: '{colors.another.self}', // invalid self reference
              },
            },
          },
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [tokens] Self token reference: \`colors.another.self\`
      - [tokens] Circular token reference: \`colors.another.self\` -> \`colors.another.self\` -> ... -> \`colors.another.self\`
      ]
    `,
    )
  })

  test('should report error for clashing token names', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        tokens: {
          colors: {
            primary: { value: '#000' },
          },
        },
        semanticTokens: {
          colors: {
            primary: { value: '{colors.bg}' }, // clashing name
          },
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [tokens] Missing token: \`colors.bg\` used in \`config.semanticTokens.colors.primary\`
      ]
    `,
    )
  })

  test('should report error for clashing recipe names', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        recipes: {
          stack: {
            className: 'stack',
          },
        },
      },
      patterns: {
        stack: {}, // clashing name
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [recipes] This recipe name is already used in \`config.patterns\`: \`stack\`
      ]
    `,
    )
  })

  test('simple token example', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        tokens: {
          colors: {
            //@ts-expect-error
            primary: 'red',
            secondary: { value: '#fff', description: 'welcome', extensions: { something: 'Alex' } },
            bbb: { value: 'blue' },
          },
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [tokens] Token must contain 'value': \`theme.tokens.colors.primary\`
      ]
    `,
    )
  })

  test('simple semantic token example', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        semanticTokens: {
          colors: {
            // @ts-expect-error
            primary: '{colors.bbb}',
            secondary: { value: '#fff', description: 'welcome', extensions: { something: 'Alex' } },
            bbb: { value: '{colors.primary}' },
            // valid: { value: { base: 'red', _dark: 'blue' }, extensions: { something: 'Alex' } },
            group: {
              nested: {
                something: {
                  value: { base: '{colors.red}', _dark: 'blue' },
                },
              },
            },
          },
        },
      },
    }

    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: ⚠️ Invalid config:
      - [tokens] Token must contain 'value': \`theme.semanticTokens.colors.primary\`
      - [tokens] Unknown token reference: \`colors.primary\` used in \`{colors.bbb}\`
      - [tokens] Missing token: \`colors.red\` used in \`config.semanticTokens.colors.group.nested.something\`
      ]
    `,
    )
  })

  // https://github.com/chakra-ui/panda/issues/2283
  test('"missing token" warning when using nested tokens', () => {
    const config: Partial<UserConfig> = {
      validation: 'error',
      theme: {
        semanticTokens: {
          colors: {
            primary: {
              DEFAULT: { value: '#ff3333' },
              lighter: { value: '#ff6666' },
            },
            background: { value: '{colors.primary}' }, // <-- ⚠️ wrong warning
            background2: { value: '{colors.primary.lighter}' }, // <-- no warning, correct
          },
        },
      },
    }

    expect(() => validateConfig(config)).not.toThrow()
  })

  // https://github.com/chakra-ui/panda/issues/2284
  test('warn about nesting in "value" twice', () => {
    const config: Partial<UserConfig> = {
      validation: 'warn',
      theme: {
        tokens: {
          colors: {
            red: {
              300: { value: 'red' },
            },
          },
        },
        semanticTokens: {
          colors: {
            primary: {
              // should probably not wrap twice in value
              value: { value: '{colors.red.300}' },
            },
          },
        },
      },
    }

    expect(validateConfig(config)).toMatchInlineSnapshot(`
      Set {
        "[tokens] You used \`value\` twice resulting in an invalid token \`theme.tokens.colors.primary.value.value\`",
      }
    `)
  })

  test('prevent space in token keys', () => {
    const config: Partial<UserConfig> = {
      validation: 'warn',
      theme: {
        tokens: {
          fonts: {
            'Press Start 1P': { value: 'Press Start 1P' },
            PressStart2P: { value: 'Press Start 2P' },
          },
        },
        semanticTokens: {
          fonts: {
            'Press Start 3P': { value: 'Press Start 3P' },
            PressStart4P: { value: 'Press Start 4P' },
          },
        },
      },
    }

    expect(validateConfig(config)).toMatchInlineSnapshot(`
      Set {
        "[tokens] Token key must not contain spaces: \`theme.tokens.fonts.Press Start 1P\`",
        "[tokens] Token key must not contain spaces: \`theme.tokens.fonts.Press Start 3P\`",
      }
    `)
  })

  test('referencing a token with DEFAULT from a DEFAULT', () => {
    const config: Partial<UserConfig> = {
      validation: 'warn',
      theme: {
        tokens: {
          colors: {
            primary: {
              DEFAULT: { value: 'blue' },
              300: { value: 'red' },
            },
          },
        },
        semanticTokens: {
          colors: {
            button: {
              primary: {
                bg: {
                  DEFAULT: {
                    value: {
                      base: '{colors.primary}',
                      _dark: 'white',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    expect(validateConfig(config)).toMatchInlineSnapshot(`undefined`)
  })

  test('using color opacity modifier on known color shouldnt throw', () => {
    const config: Partial<UserConfig> = {
      validation: 'warn',
      conditions: {
        light: '.light &',
        dark: '.dark &',
      },
      theme: {
        tokens: {
          colors: {
            blue: { 500: { value: 'blue' } },
            green: { 500: { value: 'green' } },
          },
          opacity: {
            half: { value: 0.5 },
          },
        },
        semanticTokens: {
          colors: {
            secondary: {
              value: {
                base: 'red',
                _light: '{colors.blue.500/32}', // <-- wasn't working as expected
                _dark: '{colors.green.500/half}',
              },
            },
          },
        },
      },
    }

    expect(validateConfig(config)).toMatchInlineSnapshot(`undefined`)
  })
})
