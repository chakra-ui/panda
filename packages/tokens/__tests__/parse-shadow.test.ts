import { expect, test } from 'vitest'
import { parseBoxShadowValue } from '../src/parse-shadow'

test('Parse shadow', () => {
  expect(parseBoxShadowValue('0 0 0 0 #000')).toMatchInlineSnapshot(`
      [
        {
          "blur": "0",
          "color": "#000",
          "raw": "0 0 0 0 #000",
          "spread": "0",
          "valid": true,
          "x": "0",
          "y": "0",
        },
      ]
    `)

  expect(parseBoxShadowValue('1px 1px #fff')).toMatchInlineSnapshot(`
    [
      {
        "color": "#fff",
        "raw": "1px 1px #fff",
        "valid": true,
        "x": "1px",
        "y": "1px",
      },
    ]
  `)

  expect(parseBoxShadowValue('1px 1px 0 1px #fff')).toMatchInlineSnapshot(`
    [
      {
        "blur": "0",
        "color": "#fff",
        "raw": "1px 1px 0 1px #fff",
        "spread": "1px",
        "valid": true,
        "x": "1px",
        "y": "1px",
      },
    ]
  `)

  expect(parseBoxShadowValue('1px 1px purple')).toMatchInlineSnapshot(`
    [
      {
        "color": "purple",
        "raw": "1px 1px purple",
        "valid": true,
        "x": "1px",
        "y": "1px",
      },
    ]
  `)

  expect(parseBoxShadowValue('1px #fff')).toMatchInlineSnapshot(`
    [
      {
        "color": "#fff",
        "raw": "1px #fff",
        "valid": false,
        "x": "1px",
      },
    ]
  `)
})
