import { describe, expect, test } from 'vitest'
import { Stylesheet } from '../src'
import { createContext } from './fixture'

describe('css template literal', () => {
  test('should work', () => {
    const sheet = new Stylesheet(createContext())

    sheet.processAtomic({
      width: '500px',
      height: '500px',
      background: 'red',
      ' @media (min-width: 700px)': { background: 'blue' },
    })

    expect(sheet.toCss()).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_500px {
              width: 500px
          }
          .h_500px {
              height: 500px
          }
          .bg_red {
              background: red
          }
          .\\\\[\\\\@media_\\\\(min-width\\\\:_700px\\\\)\\\\]\\\\:bg_blue {
              @media (min-width: 700px) {
                  background: blue
              }
          }
      }"
    `)
  })
})
