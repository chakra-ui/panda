import { describe, expect, test } from 'vitest'
import { astish } from '../src/astish'
import { createCss, withoutSpace } from '../src/shared'

const condRegex = /^@|&|&$/
const selectorRegex = /&|@/

const isCondition = (val: string) => condRegex.test(val)

const finalizeConditions = (paths: string[]) =>
  paths.map((path) => (selectorRegex.test(path) ? `[${withoutSpace(path.trim())}]` : path))

function sortConditions(paths: string[]) {
  return paths.sort((a, b) => {
    const aa = isCondition(a)
    const bb = isCondition(b)
    if (aa && !bb) return 1
    if (!aa && bb) return -1
    return 0
  })
}

const css_obj = createCss({
  hash: false,
  conditions: {
    shift: sortConditions,
    finalize: finalizeConditions,
    breakpoints: { keys: [] },
  },
  utility: {
    prefix: '',
    hasShorthand: false,
    resolveShorthand(prop) {
      return prop
    },
    transform(prop, value) {
      return { className: `${prop}_${withoutSpace(value)}` }
    },
  },
})

const css: typeof String.raw = (str) => css_obj(astish(str[0]))

describe('string literal [shared]', () => {
  test('should convert', () => {
    expect(css`
      font: 12px/1.5 Helvetica, Arial, sans-serif;
      color: red;
      &:hover {
        color: blue;
      }
    `).toMatchInlineSnapshot('"font_12px/1.5_Helvetica,_Arial,_sans-serif color_red [&:hover]:color_blue"')
  })
})
