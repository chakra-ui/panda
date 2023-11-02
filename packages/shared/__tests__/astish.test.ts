import { describe, expect, test } from 'vitest'
import { astish } from '../src/astish'

describe('astish', () => {
  test('should work', () => {
    const result = astish(`
      display: flex;
      align-items: center;
      -webkit-align-items: center;
      @media (min-width: 400) {
        color: red;
        justify-content: center;
      }
      @container (min-inline-width: 600px) {
        background: pink;
      }
    `)

    expect(result).toMatchInlineSnapshot(`
      {
        "-webkit-align-items": "center",
        "@container (min-inline-width: 600px)": {
          "background": "pink",
        },
        "@media (min-width: 400)": {
          "color": "red",
          "justify-content": "center",
        },
        "align-items": "center",
        "display": "flex",
      }
    `)
  })

  test('should work if undefined', () => {
    // @ts-ignore
    // can happen if a value is unresolvable in the static analysis step
    // ex: css`${someVar}`
    expect(() => astish(undefined)).not.toThrow()
  })

  test('should work with media queries', () => {
    const res = astish(`
      width: 500px;
      height: 500px;
      background: red;
      @media (min-width: 700px) {
        background: blue;
      }
    `)
    expect(res).toMatchInlineSnapshot(`
      {
        "@media (min-width: 700px)": {
          "background": "blue",
        },
        "background": "red",
        "height": "500px",
        "width": "500px",
      }
    `)
  })

  test('with multiline selectors', () => {
    const res = astish(`
    background: pink;
    & span,
    & p {
      color: blue;
    }
  `)

    expect(res).toMatchInlineSnapshot(`
      {
        "& span, & p": {
          "color": "blue",
        },
        "background": "pink",
      }
    `)
  })
})
