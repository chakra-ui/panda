import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generateSemanticTokensSpec, generateTokensSpec } from '../src/spec/tokens'

describe('generateTokensSpec', () => {
  test('should generate tokens spec with various token categories', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
            blue: { 500: { value: '#0000ff' }, 600: { value: '#0000cc' } },
            green: { value: '#00ff00', description: 'Primary green color' },
          },
          spacing: {
            sm: { value: '0.5rem' },
            md: { value: '1rem' },
            lg: { value: '1.5rem' },
          },
          fontSizes: {
            xs: { value: '0.75rem' },
            sm: { value: '0.875rem' },
            base: { value: '1rem', deprecated: true },
          },
          radii: {
            none: { value: '0' },
            sm: { value: '0.125rem' },
            md: { value: '0.375rem' },
          },
        },
      },
    })

    const spec = generateTokensSpec(ctx)

    expect(spec.type).toBe('tokens')

    // Find colors group
    const colorsGroup = spec.data.find((group) => group.type === 'colors')
    expect(colorsGroup).toBeDefined()
    if (colorsGroup) {
      expect(colorsGroup.values).toMatchInlineSnapshot(`
        [
          {
            "cssVar": "var(--colors-red)",
            "deprecated": undefined,
            "description": undefined,
            "name": "red",
            "value": "#ff0000",
          },
          {
            "cssVar": "var(--colors-blue-500)",
            "deprecated": undefined,
            "description": undefined,
            "name": "blue.500",
            "value": "#0000ff",
          },
          {
            "cssVar": "var(--colors-blue-600)",
            "deprecated": undefined,
            "description": undefined,
            "name": "blue.600",
            "value": "#0000cc",
          },
          {
            "cssVar": "var(--colors-green)",
            "deprecated": undefined,
            "description": "Primary green color",
            "name": "green",
            "value": "#00ff00",
          },
        ]
      `)

      expect(colorsGroup.functionExamples).toMatchInlineSnapshot(`
        [
          "css({ color: 'red' })",
        ]
      `)

      expect(colorsGroup.tokenFunctionExamples).toMatchInlineSnapshot(`
        [
          "token('colors.red')",
          "token.var('colors.red')",
        ]
      `)

      expect(colorsGroup.jsxExamples).toMatchInlineSnapshot(`
        [
          "<Box color="red" />",
        ]
      `)
    }

    // Find spacing group
    const spacingGroup = spec.data.find((group) => group.type === 'spacing')
    expect(spacingGroup).toBeDefined()
    if (spacingGroup) {
      expect(spacingGroup.values).toMatchInlineSnapshot(`
        [
          {
            "cssVar": "var(--spacing-sm)",
            "deprecated": undefined,
            "description": undefined,
            "name": "sm",
            "value": "0.5rem",
          },
          {
            "cssVar": "var(--spacing-md)",
            "deprecated": undefined,
            "description": undefined,
            "name": "md",
            "value": "1rem",
          },
          {
            "cssVar": "var(--spacing-lg)",
            "deprecated": undefined,
            "description": undefined,
            "name": "lg",
            "value": "1.5rem",
          },
        ]
      `)

      expect(spacingGroup.functionExamples).toMatchInlineSnapshot(`
        [
          "css({ padding: 'sm' })",
        ]
      `)
    }

    // Find fontSizes group
    const fontSizesGroup = spec.data.find((group) => group.type === 'fontSizes')
    expect(fontSizesGroup).toBeDefined()
    if (fontSizesGroup) {
      expect(fontSizesGroup.values).toMatchInlineSnapshot(`
        [
          {
            "cssVar": "var(--font-sizes-xs)",
            "deprecated": undefined,
            "description": undefined,
            "name": "xs",
            "value": "0.75rem",
          },
          {
            "cssVar": "var(--font-sizes-sm)",
            "deprecated": undefined,
            "description": undefined,
            "name": "sm",
            "value": "0.875rem",
          },
          {
            "cssVar": "var(--font-sizes-base)",
            "deprecated": true,
            "description": undefined,
            "name": "base",
            "value": "1rem",
          },
        ]
      `)

      expect(fontSizesGroup.functionExamples).toMatchInlineSnapshot(`
        [
          "css({ fontSize: 'xs' })",
        ]
      `)
    }
  })

  test('should handle different jsxStyleProps settings', () => {
    const ctx = createContext({
      eject: true,
      jsxStyleProps: 'minimal',
      theme: {
        tokens: {
          colors: {
            primary: { value: '#007bff' },
          },
        },
      },
    })

    const spec = generateTokensSpec(ctx)
    const colorsGroup = spec.data.find((group) => group.type === 'colors')
    expect(colorsGroup).toBeDefined()
    if (!colorsGroup) return

    expect(colorsGroup.jsxExamples).toMatchInlineSnapshot(`
      [
        "<Box css={{ color: 'primary' }} />",
      ]
    `)
  })

  test('should handle jsxStyleProps none setting', () => {
    const ctx = createContext({
      eject: true,
      jsxStyleProps: 'none',
      theme: {
        tokens: {
          colors: {
            primary: { value: '#007bff' },
          },
        },
      },
    })

    const spec = generateTokensSpec(ctx)
    const colorsGroup = spec.data.find((group) => group.type === 'colors')
    expect(colorsGroup).toBeDefined()
    if (!colorsGroup) return

    expect(colorsGroup.jsxExamples).toMatchInlineSnapshot(`[]`)
  })

  test('should filter out semantic, virtual, and conditional tokens', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
            blue: { value: '#0000ff' },
          },
        },
        semanticTokens: {
          colors: {
            primary: {
              value: { base: '{colors.blue}', _dark: '{colors.red}' },
            },
          },
        },
      },
    })

    const spec = generateTokensSpec(ctx)
    const colorsGroup = spec.data.find((group) => group.type === 'colors')

    // Should only contain the base tokens, not semantic ones
    expect(colorsGroup?.values).toHaveLength(2)
    expect(colorsGroup?.values.map((v) => v.name)).toEqual(['red', 'blue'])
  })

  test('should return empty data for contexts without tokens', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {},
      },
    })

    const spec = generateTokensSpec(ctx)
    expect(spec.type).toBe('tokens')
    expect(spec.data).toEqual([])
  })
})

describe('generateSemanticTokensSpec', () => {
  test('should generate semantic tokens spec with conditions', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
            blue: { value: '#0000ff' },
            gray: {
              50: { value: '#f9fafb' },
              900: { value: '#111827' },
            },
          },
        },
        semanticTokens: {
          colors: {
            primary: { value: '{colors.blue}' },
            background: { value: '{colors.gray.50}' },
            text: {
              value: '{colors.gray.900}',
              description: 'Text color that adapts to theme',
            },
          },
          spacing: {
            container: { value: '1rem' },
          },
        },
      },
    })

    const spec = generateSemanticTokensSpec(ctx)

    expect(spec.type).toBe('semantic-tokens')

    // Find colors group
    const colorsGroup = spec.data.find((group) => group.type === 'colors')
    expect(colorsGroup).toBeDefined()
    if (colorsGroup) {
      expect(colorsGroup.values).toMatchInlineSnapshot(`
        [
          {
            "cssVar": "var(--colors-primary)",
            "deprecated": undefined,
            "description": undefined,
            "name": "primary",
            "values": [
              {
                "condition": "base",
                "value": "{colors.blue}",
              },
            ],
          },
          {
            "cssVar": "var(--colors-background)",
            "deprecated": undefined,
            "description": undefined,
            "name": "background",
            "values": [
              {
                "condition": "base",
                "value": "{colors.gray.50}",
              },
            ],
          },
          {
            "cssVar": "var(--colors-text)",
            "deprecated": undefined,
            "description": undefined,
            "name": "text",
            "values": [
              {
                "condition": "base",
                "value": "{colors.gray.900}",
              },
            ],
          },
        ]
      `)

      expect(colorsGroup.functionExamples).toMatchInlineSnapshot(`
        [
          "css({ color: 'primary' })",
        ]
      `)

      expect(colorsGroup.tokenFunctionExamples).toMatchInlineSnapshot(`
        [
          "token('colors.primary')",
          "token.var('colors.primary')",
        ]
      `)

      expect(colorsGroup.jsxExamples).toMatchInlineSnapshot(`
        [
          "<Box color="primary" />",
        ]
      `)
    }

    // Find spacing group
    const spacingGroup = spec.data.find((group) => group.type === 'spacing')
    expect(spacingGroup).toBeDefined()
    if (spacingGroup) {
      expect(spacingGroup.values).toMatchInlineSnapshot(`
        [
          {
            "cssVar": "var(--spacing-container)",
            "deprecated": undefined,
            "description": undefined,
            "name": "container",
            "values": [
              {
                "condition": "base",
                "value": "1rem",
              },
            ],
          },
          {
            "cssVar": "var(--spacing-container)",
            "deprecated": undefined,
            "description": undefined,
            "name": "-container",
            "values": [
              {
                "condition": "base",
                "value": "1rem",
              },
            ],
          },
        ]
      `)

      expect(spacingGroup.functionExamples).toMatchInlineSnapshot(`
        [
          "css({ padding: 'container' })",
        ]
      `)
    }
  })

  test('should handle nested conditions', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
            blue: { value: '#0000ff' },
          },
        },
        semanticTokens: {
          colors: {
            interactive: { value: '{colors.blue}' },
          },
        },
      },
    })

    const spec = generateSemanticTokensSpec(ctx)
    const colorsGroup = spec.data.find((group) => group.type === 'colors')

    expect(colorsGroup?.values[0].values).toMatchInlineSnapshot(`
      [
        {
          "condition": "base",
          "value": "{colors.blue}",
        },
      ]
    `)
  })

  test('should handle deprecated semantic tokens', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            blue: { value: '#0000ff' },
          },
        },
        semanticTokens: {
          colors: {
            oldPrimary: { value: '{colors.blue}' },
          },
        },
      },
    })

    const spec = generateSemanticTokensSpec(ctx)
    const colorsGroup = spec.data.find((group) => group.type === 'colors')

    expect(colorsGroup?.values[0].deprecated).toBeUndefined()
  })

  test('should filter out non-semantic tokens', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
            blue: { value: '#0000ff' },
          },
        },
        semanticTokens: {
          colors: {
            primary: { value: '{colors.blue}' },
          },
        },
      },
    })

    const spec = generateSemanticTokensSpec(ctx)
    const colorsGroup = spec.data.find((group) => group.type === 'colors')

    // Should only contain semantic tokens, not base tokens
    expect(colorsGroup?.values).toHaveLength(1)
    expect(colorsGroup?.values[0].name).toBe('primary')
  })

  test('should return empty data when no semantic tokens exist', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
          },
        },
      },
    })

    const spec = generateSemanticTokensSpec(ctx)
    expect(spec.type).toBe('semantic-tokens')
    expect(spec.data).toEqual([])
  })

  test('should handle different jsxStyleProps settings for semantic tokens', () => {
    const ctx = createContext({
      eject: true,
      jsxStyleProps: 'minimal',
      theme: {
        tokens: {
          colors: {
            blue: { value: '#0000ff' },
          },
        },
        semanticTokens: {
          colors: {
            primary: { value: '{colors.blue}' },
          },
        },
      },
    })

    const spec = generateSemanticTokensSpec(ctx)
    const colorsGroup = spec.data.find((group) => group.type === 'colors')

    expect(colorsGroup?.jsxExamples).toMatchInlineSnapshot(`
      [
        "<Box css={{ color: 'primary' }} />",
      ]
    `)
  })
})
