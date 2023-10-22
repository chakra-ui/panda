import { bench, describe } from 'vitest'
import type { Dict } from '@pandacss/types'
import postcss from 'postcss'
import postcssNested from 'postcss-nested'
import { postCssJs } from '../src/post-css-js'
import { safeParse } from '../src/safe-parse'
import { markImportant } from '@pandacss/shared'

const obj = {
  base: 1,
  sm: { _hover: 2, truncate: true },
  _dark: {
    _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
    base: 3,
    md: 4,
    lg: { base: 5, _hover: 6 },
    _focus: [7, undefined, null, 8, 9],
  },
  obj: {
    base: 1,
    sm: { _hover: 2, truncate: true },
    _dark: {
      _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
      base: 3,
      md: 4,
      lg: { base: 5, _hover: 6 },
      _focus: [7, undefined, null, 8, 9],
    },
    obj: {
      base: 1,
      sm: { _hover: 2, truncate: true },
      _dark: {
        _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
        base: 3,
        md: 4,
        lg: { base: 5, _hover: 6 },
        _focus: [7, undefined, null, 8, 9],
      },
      obj: {
        base: 1,
        sm: { _hover: 2, truncate: true },
        _dark: {
          _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
          base: 3,
          md: 4,
          lg: { base: 5, _hover: 6 },
          _focus: [7, undefined, null, 8, 9],
        },
        obj: {
          base: 1,
          sm: { _hover: 2, truncate: true },
          _dark: {
            _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
            base: 3,
            md: 4,
            lg: { base: 5, _hover: 6 },
            _focus: [7, undefined, null, 8, 9],
          },
          obj: {
            base: 1,
            sm: { _hover: 2, truncate: true },
            _dark: {
              _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
              base: 3,
              md: 4,
              lg: { base: 5, _hover: 6 },
              _focus: [7, undefined, null, 8, 9],
            },
            obj: {
              base: 1,
              sm: { _hover: 2, truncate: true },
              _dark: {
                _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
                base: 3,
                md: 4,
                lg: { base: 5, _hover: 6 },
                _focus: [7, undefined, null, 8, 9],
              },
              obj: {
                base: 1,
                sm: { _hover: 2, truncate: true },
                _dark: {
                  _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
                  base: 3,
                  md: 4,
                  lg: { base: 5, _hover: 6 },
                  _focus: [7, undefined, null, 8, 9],
                },
                obj: {
                  base: 1,
                  sm: { _hover: 2, truncate: true },
                  _dark: {
                    _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
                    base: 3,
                    md: 4,
                    lg: { base: 5, _hover: 6 },
                    _focus: [7, undefined, null, 8, 9],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

describe('traverse', () => {
  bench(
    'toCss already marked important',
    () => {
      toCss(markImportant(obj))
    },
    { iterations: 100 },
  )

  bench(
    'toCss with postcss important',
    () => {
      toCss(obj, { important: true })
    },
    { iterations: 100 },
  )
})

export function toCss(styles: Dict, { important }: { important?: boolean } = {}) {
  const result = postcss([
    postcssNested({
      bubble: ['breakpoint'],
    }),
  ]).process(styles, {
    parser: postCssJs.parser,
  })

  if (important) {
    result.root.walkDecls((decl) => {
      decl.important = true
    })
  }

  return result as postcss.LazyResult
}

export function cssToJs(css: string) {
  return postCssJs.objectify(safeParse(css))
}
