import { describe, expect, test } from 'vitest'
import { importParser } from './fixture'

describe('extract imports', () => {
  test('should work', () => {
    const code = `
    import { css as nCss } from "@panda/css"

    css({ bg: "red" })
    `

    expect(importParser(code, { name: 'css', module: '@panda/css' })).toMatchInlineSnapshot(`
      [
        {
          "alias": "nCss",
          "mod": "@panda/css",
          "name": "css",
        },
      ]
    `)
  })
})
