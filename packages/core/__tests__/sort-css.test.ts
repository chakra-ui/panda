import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import sortCss from '../src/plugins/sort-css'
import prettify from '../src/plugins/prettify'

function run(code: string) {
  return postcss([sortCss(), prettify()]).process(code, { from: undefined }).css
}

describe('sort css', () => {
  test('root level', () => {
    expect(
      run(`
      .justify_center {
        justify-content: center
      }
        .hover:text_red.200:where(:hover, [data-hover]) {
          color: var(--colors-red-200)
        }
    
      .w_5 {
        width: var(--sizes-5)
      }`),
    ).toMatchInlineSnapshot(`
      ".justify_center {
        justify-content: center
      }

      .w_5 {
        width: var(--sizes-5)
      }

      .hover:text_red.200:where(:hover, [data-hover]) {
        color: var(--colors-red-200)
      }"
    `)
  })

  test('@layer', () => {
    expect(
      run(`
      @layer utilities {
        .d_flex {
          display: flex
        }
      
        .items_center {
          align-items: center
        }
      
        .justify_center {
          justify-content: center
        }
          .hover:text_red.200:where(:hover, [data-hover]) {
            color: var(--colors-red-200)
          }
      
        .w_5 {
          width: var(--sizes-5)
        }
      
        .h_6 {
          height: var(--sizes-6)
        }
      
        .w_12 {
          width: var(--sizes-12)
        }
      
        .h_12 {
          height: var(--sizes-12)
        }
          .hover:bg_red.50:where(:hover, [data-hover]) {
            background: var(--colors-red-50)
          }
      
        .animation-name_red {
          animation-name: red
        }
      
        .rounded_8px {
          border-radius: 8px
        }
      
        .rounded_999px {
          border-radius: 999px
        }
      }`),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
        }

        .items_center {
          align-items: center
        }

        .justify_center {
          justify-content: center
        }

        .w_5 {
          width: var(--sizes-5)
        }

        .h_6 {
          height: var(--sizes-6)
        }

        .w_12 {
          width: var(--sizes-12)
        }

        .h_12 {
          height: var(--sizes-12)
        }

        .animation-name_red {
          animation-name: red
        }

        .rounded_8px {
          border-radius: 8px
        }

        .rounded_999px {
          border-radius: 999px
        }

        .hover:text_red.200:where(:hover, [data-hover]) {
          color: var(--colors-red-200)
        }

        .hover:bg_red.50:where(:hover, [data-hover]) {
          background: var(--colors-red-50)
        }
      }"
    `)
  })
})
