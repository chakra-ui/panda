import { createCss } from '@pandacss/shared'
import { describe, expect, test } from 'vitest'

import type { SystemStyleObject } from '@pandacss/types'
import { createRuleProcessor } from './fixture'
import { createGeneratorContext } from '@pandacss/fixture'

const config = { prefix: 'tw', hash: { className: true, cssVar: true } }
const backend = (styles: SystemStyleObject) => createRuleProcessor(config).css(styles).toCss()

const frontend = createCss(createGeneratorContext(config).baseSheetContext)

describe('atomic-rule / prefix', () => {
  test('should product consistent hash', () => {
    expect(backend({ color: 'red' })).toMatchInlineSnapshot(`
      "@layer utilities {
        .tw-wxtrg {
          color: red;
      }
      }"
    `)
    expect(frontend({ color: 'red' })).toMatchInlineSnapshot(`"tw-wxtrg"`)

    expect(backend({ color: { sm: 'red' } })).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (min-width: 40rem) {
          .tw-eIFrkw {
            color: red;
      }
      }
      }"
    `)
    expect(frontend({ color: { sm: 'red' } })).toMatchInlineSnapshot(`"tw-eIFrkw"`)
  })
})
