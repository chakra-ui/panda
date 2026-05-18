import { describe, expect, test } from 'vitest'
import { createConfigSnapshot, createSerializedConfig } from '../src'

describe('serialized config', () => {
  test('keeps utility transform functions as callback references', () => {
    const transform = (value: string) => ({ width: value, height: value })
    const snapshot = createConfigSnapshot({
      cwd: '/project',
      include: [],
      outdir: 'styled-system',
      utilities: {
        size: {
          className: 'size',
          transform,
        },
      },
    })

    expect(snapshot.config.utilities).toMatchInlineSnapshot(`
      {
        "size": {
          "className": "size",
          "transform": {
            "id": "utilities.size.transform",
            "kind": "js-callback",
          },
        },
      }
    `)
    expect(snapshot.callbacks['utility.transform']?.['utilities.size.transform']).toBe(transform)
  })

  test('createSerializedConfig returns only the JSON-safe config payload', () => {
    const config = createSerializedConfig({
      cwd: '/project',
      include: [],
      outdir: 'styled-system',
      hooks: {
        'config:resolved': () => undefined,
      },
      utilities: {
        size: {
          transform: (value: string) => ({ width: value }),
        },
      },
    })

    expect(config).toMatchInlineSnapshot(`
      {
        "cwd": "/project",
        "importMap": {
          "css": [
            "styled-system/css",
          ],
          "jsx": [
            "styled-system/jsx",
          ],
          "pattern": [
            "styled-system/patterns",
          ],
          "recipe": [
            "styled-system/recipes",
          ],
          "tokens": [
            "styled-system/tokens",
          ],
        },
        "include": [],
        "outdir": "styled-system",
        "utilities": {
          "size": {
            "transform": {
              "id": "utilities.size.transform",
              "kind": "js-callback",
            },
          },
        },
      }
    `)
  })

  test('strips runtime-only keys only at the root', () => {
    const config = createSerializedConfig({
      cwd: '/project',
      include: [],
      outdir: 'styled-system',
      name: 'runtime-preset-name',
      hooks: {
        'config:resolved': () => undefined,
      },
      theme: {
        tokens: {
          colors: {
            brand: {
              name: { value: 'Brand' },
              presets: { value: 'keep-me' },
            },
          },
        },
      },
      utilities: {
        badge: {
          className: 'badge',
          values: {
            name: 'semantic-name',
          },
        },
      },
    })

    expect(config).not.toHaveProperty('name')
    expect(config).not.toHaveProperty('hooks')
    expect(config.theme).toMatchObject({
      tokens: {
        colors: {
          brand: {
            name: { value: 'Brand' },
            presets: { value: 'keep-me' },
          },
        },
      },
    })
    expect(config.utilities).toMatchObject({
      badge: {
        className: 'badge',
        values: {
          name: 'semantic-name',
        },
      },
    })
  })

  test('serializes regex jsx matchers', () => {
    const config = createSerializedConfig({
      cwd: '/project',
      include: [],
      outdir: 'styled-system',
      theme: {
        recipes: {
          button: {
            jsx: ['Button', /WithRegex$/i],
            variants: {
              size: {
                sm: { fontSize: '12px' },
              },
            },
          },
        },
      },
    })

    expect((config as any).theme.recipes.button.jsx).toMatchInlineSnapshot(`
      [
        "Button",
        {
          "flags": "i",
          "kind": "regex",
          "source": "WithRegex$",
        },
      ]
    `)
  })
})
