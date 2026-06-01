import { describe, expect, it } from 'vitest'
import { type Spec, introspect } from '../src'

const spec: Spec = {
  conditions: { keys: ['base', '_hover', 'md'], breakpoints: ['md'] },
  tokens: {
    categories: { colors: { name: 'colors', typeName: 'ColorToken', values: ['red.500'] } },
    colorPalettes: ['red'],
    values: { 'colors.red.500': '#f00', 'spacing.4': '1rem' },
    deprecated: ['spacing.4'],
  },
  utilities: {
    properties: {
      color: { name: 'color', cssProperty: 'color', tokenCategory: 'colors', literals: [], alias: 'color' },
      padding: { name: 'padding', cssProperty: 'padding', tokenCategory: 'spacing', literals: [], alias: 'padding' },
    },
    shorthands: { p: 'padding' },
    deprecated: [],
  },
  patterns: { patterns: { stack: {}, grid: {} } },
  recipes: { recipes: { button: {} }, slotRecipes: { menu: {} } },
  propertyOrder: ['padding', 'color'],
  jsxFactory: 'styled',
}

describe('introspect', () => {
  const t = introspect(spec)

  it('validates properties + resolves shorthands', () => {
    expect({
      validColor: t.isValidProperty('color'),
      validShorthand: t.isValidProperty('p'),
      validUnknown: t.isValidProperty('nope'),
      resolved: t.resolveShorthand('p'),
      shorthandsOfPadding: t.getShorthands('padding'),
    }).toMatchInlineSnapshot(`
      {
        "resolved": "padding",
        "shorthandsOfPadding": [
          "p",
        ],
        "validColor": true,
        "validShorthand": true,
        "validUnknown": false,
      }
    `)
  })

  it('classifies property categories', () => {
    expect({
      color: t.getPropCategory('color'),
      padding: t.getPropCategory('p'),
      isColorColor: t.isColorProperty('color'),
      isColorPadding: t.isColorProperty('p'),
    }).toMatchInlineSnapshot(`
      {
        "color": "colors",
        "isColorColor": true,
        "isColorPadding": false,
        "padding": "spacing",
      }
    `)
  })

  it('validates + filters tokens', () => {
    expect({
      valid: t.isValidToken('colors.red.500'),
      deprecated: t.isDeprecatedToken('spacing.4'),
      colorToken: t.isColorToken('colors.red.500'),
      nonColorToken: t.isColorToken('spacing.4'),
      invalid: t.filterInvalidTokens(['colors.red.500', 'colors.ghost']),
      deprecatedFilter: t.filterDeprecatedTokens(['colors.red.500', 'spacing.4']),
    }).toMatchInlineSnapshot(`
      {
        "colorToken": true,
        "deprecated": true,
        "deprecatedFilter": [
          "spacing.4",
        ],
        "invalid": [
          "colors.ghost",
        ],
        "nonColorToken": false,
        "valid": true,
      }
    `)
  })

  it('lists conditions, patterns, recipes, jsx factory', () => {
    expect({
      conditions: t.conditions(),
      patterns: t.patterns(),
      recipes: t.recipes(),
      jsxFactory: t.jsxFactory(),
    }).toMatchInlineSnapshot(`
      {
        "conditions": [
          "base",
          "_hover",
          "md",
        ],
        "jsxFactory": "styled",
        "patterns": [
          "stack",
          "grid",
        ],
        "recipes": [
          "button",
          "menu",
        ],
      }
    `)
  })

  it('sorts style-object keys: properties (emit order) → conditions → unknown', () => {
    expect(t.sortProps(['_hover', 'color', 'zzz', 'p', 'padding'])).toMatchInlineSnapshot(`
      [
        "p",
        "padding",
        "color",
        "zzz",
        "_hover",
      ]
    `)
  })
})
