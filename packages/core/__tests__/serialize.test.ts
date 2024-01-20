import { createContext } from '@pandacss/fixture'
import type { Dict } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { serializeStyles } from '../src/serialize'

const css = (style: Dict) => {
  return serializeStyles(createContext(), style)
}

describe('serialize', () => {
  test('should serialize', () => {
    const result = css({
      html: {
        color: 'red',
        border: '2px solid {colors.red.200}',
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "border": "2px solid var(--colors-red-200)",
          "color": "red",
        },
      }
    `)
  })

  test('skip non-existent', () => {
    const result = css({
      html: {
        border: '2px solid {colors.red.xxx}',
        bg: '{colors.xxx}',
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "background": "colors\\\\.xxx",
          "border": "2px solid colors\\\\.red\\\\.xxx",
        },
      }
    `)
  })

  test('in media query', () => {
    const result = css({
      html: {
        '@container (min-width: {sizes.4xl})': {
          color: 'green',
        },
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "@container (min-width: 56rem)": {
            "color": "green",
          },
        },
      }
    `)
  })

  test('expand multiple references', () => {
    const result = css({
      html: {
        padding: '{spacing.3} {spacing.5}',
        _hover: {
          padding: '{spacing.7}',
        },
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "&:is(:hover, [data-hover])": {
            "padding": "var(--spacing-7)",
          },
          "padding": "var(--spacing-3) var(--spacing-5)",
        },
      }
    `)
  })
})

describe('serialize - with token()', () => {
  test('should serialize', () => {
    const result = css({
      html: {
        color: 'red',
        border: '2px solid token(colors.red.200)',
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "border": "2px solid var(--colors-red-200)",
          "color": "red",
        },
      }
    `)
  })

  test('in media query', () => {
    const result = css({
      html: {
        '@container (min-width: token(sizes.4xl))': {
          color: 'green',
        },
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "@container (min-width: 56rem)": {
            "color": "green",
          },
        },
      }
    `)
  })

  test('skip non-existent', () => {
    const result = css({
      html: {
        border: '2px solid token(colors.red.xxx)',
        bg: '{colors.xxx}',
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "background": "colors\\\\.xxx",
          "border": "2px solid colors\\\\.red\\\\.xxx",
        },
      }
    `)
  })

  test('expand multiple references', () => {
    const result = css({
      html: {
        padding: 'token(spacing.3) token(spacing.5)',
        _hover: {
          padding: 'token(spacing.7)',
        },
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "&:is(:hover, [data-hover])": {
            "padding": "var(--spacing-7)",
          },
          "padding": "var(--spacing-3) var(--spacing-5)",
        },
      }
    `)
  })

  test('with fallback', () => {
    const result = css({
      html: {
        color: 'red',
        border: '2px solid token(colors.red.300, blue)',
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "border": "2px solid var(--colors-red-300, blue)",
          "color": "red",
        },
      }
    `)
  })

  test('with fallback reference', () => {
    const result = css({
      html: {
        color: 'red',
        border: '2px solid token(colors.red.300, colors.blue.300)',
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "html": {
          "border": "2px solid var(--colors-red-300, var(--colors-blue-300))",
          "color": "red",
        },
      }
    `)
  })

  // TODO: This is not supported yet
  // test.skip('with nested fallback reference', () => {
  //   const result = css({
  //     html: {
  //       color: 'red',
  //       border: '2px solid token(colors.red.300, token(colors.blue.300, colors.green.300))',
  //     },
  //   })

  //   expect(result).toMatchInlineSnapshot(`
  //     {
  //       "html": {
  //         "border": "2px solid var(--colors-red-300, var(--colors-blue-300, var(--colors-green-300)))",
  //         "color": "red",
  //       },
  //     }
  //   `)
  // })
})
