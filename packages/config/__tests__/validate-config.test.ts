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
            primary: { value: '#000' },
            secondary: { value: '#fff' },
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
      `[Error: [tokens]: Token paths must end with 'value': \`theme.tokens.colors.secondary\`]`,
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
        "[breakpoints]: All breakpoints must use the same unit: \`640em, 768px, 1024px\`",
        "[conditions]: Selectors should contain the \`&\` character: \`[data-theme="pink"]\`",
        "[tokens]: Token paths must end with 'value': \`theme.tokens.colors.secondary\`",
        "[tokens]: Token paths must end with 'value': \`theme.tokens.colors.group.with.invalid\`",
        "[tokens]: Semantic token paths must contain 'value': \`theme.semanticTokens.colors.another.group.invalid\`",
        "[tokens]: Missing token: \`colors.doesntexist\` used in \`config.semanticTokens.colors.another.group.stillok\`",
        "[tokens]: Circular token reference: \`colors.another.group.recursive\` -> \`colors.another.circular\` -> ... -> \`colors.another.group.recursive\`",
        "[tokens]: Missing token: \`colors.missing\` used in \`config.semanticTokens.colors.another.group.missing\`",
        "[tokens]: Self token reference: \`colors.another.self\`",
        "[tokens]: Circular token reference: \`colors.another.self\` -> \`colors.another.self\` -> ... -> \`colors.another.self\`",
        "[tokens]: Circular token reference: \`colors.another.circular\` -> \`colors.another.group.recursive\` -> ... -> \`colors.another.circular\`",
        "[tokens]: Missing token: \`fontSizes.md2\` used in \`config.semanticTokens.fontSizes.main\`",
        "[recipes]: This recipe name is already used in \`config.patterns\`: btn-primary",
      }
    `)
  })

  test('should report error if breakpoints use different units', () => {
    const config = {
      theme: {
        breakpoints: {
          sm: '640em', // invalid unit
          md: '768px',
          lg: '1024px',
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [breakpoints]: All breakpoints must use the same unit: \`640em, 768px, 1024px\`]`,
    )
  })

  test('should report error for condition selectors without & character', () => {
    const config = {
      conditions: {
        pinkTheme: '[data-theme="pink"]', // invalid selector
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [conditions]: Selectors should contain the \`&\` character: \`[data-theme="pink"]\`]`,
    )
  })

  test('should report error for token paths not ending with value', () => {
    const config: Partial<UserConfig> = {
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
      `[Error: [tokens]: Token paths must end with 'value': \`theme.tokens.colors.secondary\`]`,
    )
  })

  test('should report error for semantic token paths not containing value', () => {
    const config: Partial<UserConfig> = {
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
      `[Error: [tokens]: Semantic token paths must contain 'value': \`theme.semanticTokens.colors.invalid\`]`,
    )
  })

  test('should report error for missing token references', () => {
    const config = {
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
      `[Error: [tokens]: Missing token: \`colors.doesntexist\` used in \`config.semanticTokens.colors.another.group.stillok\`]`,
    )
  })

  test('should report error for circular token references', () => {
    const config = {
      theme: {
        semanticTokens: {
          colors: {
            another: {
              circular: {
                value: '{colors.another.group.recursive}', // invalid circular reference
              },
            },
          },
        },
      },
    }
    expect(() => validateConfig(config)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [tokens]: Missing token: \`colors.another.group.recursive\` used in \`config.semanticTokens.colors.another.circular\`]`,
    )
  })

  test('should report error for self token references', () => {
    const config = {
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
      `[Error: [tokens]: Self token reference: \`colors.another.self\`]`,
    )
  })

  test('should report error for clashing token names', () => {
    const config = {
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
      `[Error: [tokens]: Missing token: \`colors.bg\` used in \`config.semanticTokens.colors.primary\`]`,
    )
  })

  test('should report error for clashing recipe names', () => {
    const config = {
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
      `[Error: [recipes]: This recipe name is already used in \`config.patterns\`: \`stack\`]`,
    )
  })
})
