import { describe, expect, test } from 'vitest'
import { createToken } from '../src/token'

describe('token data', () => {
  test('basic', () => {
    expect(
      createToken({
        value: '#000',
        path: ['colors', 'blue', '50'],
      }),
    ).toMatchInlineSnapshot(`
      {
        "category": "colors",
        "condition": "",
        "description": "",
        "key": "blue.50",
        "negative": false,
        "path": [
          "blue",
          "50",
        ],
        "prop": "colors.blue.50",
        "semantic": false,
        "value": "#000",
        "var": "--colors-blue-50",
        "varRef": "var(--colors-blue-50)",
      }
    `)

    expect(
      createToken({
        value: '40px',
        negative: true,
        path: ['spacing', 'sm'],
      }),
    ).toMatchInlineSnapshot(`
      {
        "category": "spacing",
        "condition": "",
        "description": "",
        "key": "-sm",
        "negative": true,
        "path": [
          "-sm",
        ],
        "prop": "spacing.-sm",
        "semantic": false,
        "value": "-40px",
        "var": "--spacing-sm",
        "varRef": "calc(var(--spacing-sm) * -1)",
      }
    `)
  })
})
