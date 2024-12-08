import { describe, expect, test } from 'vitest'
import { stringify } from '../src/stringify'

describe('stringify', () => {
  test('should convert', () => {
    expect(stringify({ whiteSpace: 'nowrap' })).toMatchInlineSnapshot(`
      "white-space: nowrap;
      "
    `)

    expect(stringify({ '--welcome-x': '20' })).toMatchInlineSnapshot(`
      "--welcome-x: 20;
      "
    `)
  })

  test('convert @scope in nesting', () => {
    expect(
      stringify({
        '.parent': {
          color: 'blue',
          '@scope (& > .scope) to (& .limit)': { '& .content': { color: 'red' } },
        },
      }),
    ).toMatchInlineSnapshot(`
      ".parent {color: blue;
      }@scope (.parent > .scope) to (.parent .limit) {.parent .content {color: red;
      }
      }
      "
    `)
  })
})
