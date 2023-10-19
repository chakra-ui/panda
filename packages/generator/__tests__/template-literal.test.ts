import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'
import type { SystemStyleObject } from '@pandacss/types'

describe('css template literal', () => {
  test('should work', () => {
    const css = (styles: SystemStyleObject) => {
      return createRuleProcessor({ syntax: 'template-literal' }).css(styles).toCss()
    }

    expect(
      css({
        width: '500px',
        height: '500px',
        background: 'red',
        '@media (min-width: 700px)': { background: 'blue' },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .width_500px {
          width: 500px;
        }

        .height_500px {
          height: 500px;
        }

        .background_red {
          background: red;
        }

        @media (width >= 700px) {
          .\\\\[\\\\@media_\\\\(min-width\\\\:_700px\\\\)\\\\]\\\\:background_blue {
            background: #00f;
          }
        }
      }
      "
    `)
  })
})
