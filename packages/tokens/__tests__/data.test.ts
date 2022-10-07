import { describe, expect, test } from 'vitest'
import { getTokenData } from '../src/token-data'

describe('token data', () => {
  test('basic', () => {
    expect(
      getTokenData({
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
        "prop": "colors.blue.50",
        "value": "#000",
        "var": "--colors-blue-50",
        "varRef": "var(--colors-blue-50)",
      }
    `)

    expect(
      getTokenData({
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
        "prop": "spacing.-sm",
        "value": "-40px",
        "var": "--spacing-sm",
        "varRef": "calc(var(--spacing-sm) * -1)",
      }
    `)
  })
})
