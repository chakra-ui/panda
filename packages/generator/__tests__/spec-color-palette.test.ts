import { describe, expect, test } from 'vitest'
import { createContext } from '@pandacss/fixture'
import { generateColorPaletteSpec } from '../src/spec/color-palette'

describe('color palette spec generation', () => {
  test('should generate color palette spec with numeric shades', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            blue: {
              50: { value: '#eff6ff' },
              100: { value: '#dbeafe' },
              200: { value: '#bfdbfe' },
              300: { value: '#93c5fd' },
              400: { value: '#60a5fa' },
              500: { value: '#3b82f6' },
              600: { value: '#2563eb' },
              700: { value: '#1d4ed8' },
              800: { value: '#1e40af' },
              900: { value: '#1e3a8a' },
            },
            red: {
              500: { value: '#ef4444' },
            },
          },
        },
      },
    })

    const spec = generateColorPaletteSpec(ctx)
    expect(spec).toMatchInlineSnapshot(`
      {
        "data": {
          "functionExamples": [
            "css({ colorPalette: 'blue' })",
            "css({ colorPalette: 'blue', bg: 'colorPalette.100', color: 'colorPalette.200' })",
          ],
          "jsxExamples": [
            "<Box colorPalette="blue" />",
            "<Box colorPalette="blue" bg="colorPalette.100" color="colorPalette.200" />",
          ],
          "values": [
            "blue",
            "red",
          ],
        },
        "type": "color-palette",
      }
    `)
  })

  test('should generate color palette spec with non-numeric tokens', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            brand: {
              primary: { value: '#0066cc' },
              secondary: { value: '#6699ff' },
              tertiary: { value: '#003366' },
            },
            ui: {
              background: { value: '#ffffff' },
              text: { value: '#333333' },
              border: { value: '#e0e0e0' },
            },
          },
        },
      },
    })

    const spec = generateColorPaletteSpec(ctx)
    expect(spec).toMatchInlineSnapshot(`
      {
        "data": {
          "functionExamples": [
            "css({ colorPalette: 'brand' })",
            "css({ colorPalette: 'brand', bg: 'colorPalette.primary', color: 'colorPalette.secondary' })",
          ],
          "jsxExamples": [
            "<Box colorPalette="brand" />",
            "<Box colorPalette="brand" bg="colorPalette.primary" color="colorPalette.secondary" />",
          ],
          "values": [
            "brand",
            "ui",
          ],
        },
        "type": "color-palette",
      }
    `)
  })

  test('should generate color palette spec with mixed token types', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            accent: {
              DEFAULT: { value: '#8b5cf6' },
              hover: { value: '#7c3aed' },
              active: { value: '#6d28d9' },
              disabled: { value: '#c4b5fd' },
            },
            neutral: {
              50: { value: '#fafafa' },
              100: { value: '#f5f5f5' },
              base: { value: '#737373' },
              dark: { value: '#404040' },
            },
          },
        },
      },
    })

    const spec = generateColorPaletteSpec(ctx)
    expect(spec).toMatchInlineSnapshot(`
      {
        "data": {
          "functionExamples": [
            "css({ colorPalette: 'accent' })",
            "css({ colorPalette: 'accent', bg: 'colorPalette', color: 'colorPalette.active' })",
          ],
          "jsxExamples": [
            "<Box colorPalette="accent" />",
            "<Box colorPalette="accent" bg="colorPalette" color="colorPalette.active" />",
          ],
          "values": [
            "accent",
            "neutral",
          ],
        },
        "type": "color-palette",
      }
    `)
  })

  test('should handle single token in color palette', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            primary: { value: '#0066cc' },
          },
        },
      },
    })

    const spec = generateColorPaletteSpec(ctx)
    expect(spec).toMatchInlineSnapshot(`
      {
        "data": {
          "functionExamples": [
            "css({ colorPalette: 'primary' })",
            "css({ colorPalette: 'primary', bg: 'colorPalette' })",
          ],
          "jsxExamples": [
            "<Box colorPalette="primary" />",
            "<Box colorPalette="primary" bg="colorPalette" />",
          ],
          "values": [
            "primary",
          ],
        },
        "type": "color-palette",
      }
    `)
  })

  test('should handle color palette with no virtual tokens', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            basic: {
              red: { value: '#ff0000' },
              green: { value: '#00ff00' },
              blue: { value: '#0000ff' },
            },
          },
        },
      },
    })

    const spec = generateColorPaletteSpec(ctx)
    expect(spec).toMatchInlineSnapshot(`
      {
        "data": {
          "functionExamples": [
            "css({ colorPalette: 'basic' })",
            "css({ colorPalette: 'basic', bg: 'colorPalette.blue', color: 'colorPalette.green' })",
          ],
          "jsxExamples": [
            "<Box colorPalette="basic" />",
            "<Box colorPalette="basic" bg="colorPalette.blue" color="colorPalette.green" />",
          ],
          "values": [
            "basic",
          ],
        },
        "type": "color-palette",
      }
    `)
  })

  test('should handle jsxStyleProps minimal setting', () => {
    const ctx = createContext({
      eject: true,
      jsxStyleProps: 'minimal',
      theme: {
        tokens: {
          colors: {
            theme: {
              light: { value: '#f8f9fa' },
              dark: { value: '#212529' },
            },
          },
        },
      },
    })

    const spec = generateColorPaletteSpec(ctx)
    expect(spec).toMatchInlineSnapshot(`
      {
        "data": {
          "functionExamples": [
            "css({ colorPalette: 'theme' })",
            "css({ colorPalette: 'theme', bg: 'colorPalette.dark', color: 'colorPalette.light' })",
          ],
          "jsxExamples": [
            "<Box css={{ colorPalette: 'theme' }} />",
            "<Box css={{ colorPalette: 'theme', bg: 'colorPalette.dark', color: 'colorPalette.light' }} />",
          ],
          "values": [
            "theme",
          ],
        },
        "type": "color-palette",
      }
    `)
  })

  test('should handle jsxStyleProps none setting', () => {
    const ctx = createContext({
      eject: true,
      jsxStyleProps: 'none',
      theme: {
        tokens: {
          colors: {
            status: {
              success: { value: '#10b981' },
              error: { value: '#ef4444' },
            },
          },
        },
      },
    })

    const spec = generateColorPaletteSpec(ctx)
    expect(spec).toMatchInlineSnapshot(`
      {
        "data": {
          "functionExamples": [
            "css({ colorPalette: 'status' })",
            "css({ colorPalette: 'status', bg: 'colorPalette.error', color: 'colorPalette.success' })",
          ],
          "jsxExamples": [],
          "values": [
            "status",
          ],
        },
        "type": "color-palette",
      }
    `)
  })

  test('should handle disabled color palette', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        colorPalette: {
          enabled: false,
        },
        tokens: {
          colors: {
            primary: { value: '#0066cc' },
          },
        },
      },
    })

    const spec = generateColorPaletteSpec(ctx)
    expect(spec).toBeNull()
  })

  test('should handle deeply nested color tokens', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            theme: {
              primary: {
                base: { value: '#3b82f6' },
                hover: { value: '#2563eb' },
                active: { value: '#1d4ed8' },
              },
              secondary: {
                base: { value: '#8b5cf6' },
                hover: { value: '#7c3aed' },
              },
            },
          },
        },
      },
    })

    const spec = generateColorPaletteSpec(ctx)
    expect(spec).toMatchInlineSnapshot(`
      {
        "data": {
          "functionExamples": [
            "css({ colorPalette: 'theme' })",
            "css({ colorPalette: 'theme', bg: 'colorPalette.primary.active', color: 'colorPalette.primary.base' })",
          ],
          "jsxExamples": [
            "<Box colorPalette="theme" />",
            "<Box colorPalette="theme" bg="colorPalette.primary.active" color="colorPalette.primary.base" />",
          ],
          "values": [
            "theme",
            "theme.primary",
            "theme.secondary",
          ],
        },
        "type": "color-palette",
      }
    `)
  })
})
