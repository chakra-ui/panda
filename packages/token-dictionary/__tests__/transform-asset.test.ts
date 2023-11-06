import { readFileSync } from 'fs'
import { describe, expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { transformAssets } from '../src/transform'

describe('transform / assets', () => {
  test('with raw svg', () => {
    const dictionary = new TokenDictionary({
      tokens: {
        assets: {
          checkbox: {
            value: {
              type: 'svg',
              value: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h8"/></svg>`,
            },
          },
        },
      },
    })

    dictionary.registerTransform(transformAssets)
    dictionary.build()

    expect(dictionary.allTokens).toMatchInlineSnapshot(`
      [
        Token {
          "description": undefined,
          "extensions": {
            "category": "assets",
            "condition": "base",
            "prop": "checkbox",
          },
          "name": "assets.checkbox",
          "originalValue": "url('data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e)'",
          "path": [
            "assets",
            "checkbox",
          ],
          "type": "asset",
          "value": "url('data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e)'",
        },
      ]
    `)
  })

  test('file path', () => {
    const read = (file: string) => readFileSync(require.resolve(file), 'utf8')

    const dictionary = new TokenDictionary({
      tokens: {
        assets: {
          checkbox: {
            description: 'checkbox icon',
            value: { type: 'svg', value: read('./checkbox.svg') },
          },
        },
      },
    })

    dictionary.registerTransform(transformAssets)
    dictionary.build()

    expect(dictionary.allTokens).toMatchInlineSnapshot(`
      [
        Token {
          "description": "checkbox icon",
          "extensions": {
            "category": "assets",
            "condition": "base",
            "prop": "checkbox",
          },
          "name": "assets.checkbox",
          "originalValue": "url('data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e)'",
          "path": [
            "assets",
            "checkbox",
          ],
          "type": "asset",
          "value": "url('data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e)'",
        },
      ]
    `)
  })

  test('image', () => {
    const dictionary = new TokenDictionary({
      tokens: {
        assets: {
          mesh: {
            value: { type: 'url', value: '/mesh.png' },
          },
        },
      },
    })

    dictionary.registerTransform(transformAssets)
    dictionary.build()

    expect(dictionary.allTokens).toMatchInlineSnapshot(`
      [
        Token {
          "description": undefined,
          "extensions": {
            "category": "assets",
            "condition": "base",
            "prop": "mesh",
          },
          "name": "assets.mesh",
          "originalValue": "url('/mesh.png')",
          "path": [
            "assets",
            "mesh",
          ],
          "type": "asset",
          "value": "url('/mesh.png')",
        },
      ]
    `)
  })
})
