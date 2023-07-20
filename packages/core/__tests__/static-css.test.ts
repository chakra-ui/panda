import { describe, expect, test } from 'vitest'
import { getStaticCss } from '../src/static-css'

const ctx = {
  breakpoints: ['sm', 'md'],
  getRecipeKeys: (recipe: string) => {
    const values: Record<string, any> = {
      buttonStyle: {
        size: ['sm', 'md'],
        variant: ['primary', 'secondary'],
      },
      tooltipStyle: {
        __base: {
          '&[data-tooltip], & [data-tooltip]': {
            color: { _dark: 'red' },
          },
        },
      },
    }

    return values[recipe] ?? {}
  },
  getPropertyKeys: (property: string) => {
    const values: Record<string, any> = {
      margin: ['20px', '40px'],
      padding: ['20px', '40px', '60px'],
      color: ['red.200', 'blue.200', 'green.200'],
    }
    return values[property] ?? []
  },
}

const getStyles = getStaticCss({
  css: [
    {
      conditions: ['sm', 'md'],
      properties: {
        margin: ['20px', '40px'],
        padding: ['20px', '40px', '60px'],
      },
    },
    {
      conditions: ['light', 'dark'],
      properties: {
        color: ['*'],
      },
    },
  ],
  recipes: {
    buttonStyle: [
      {
        size: ['sm', 'md'],
        conditions: ['sm', 'md'],
      },
      { variant: ['primary', 'secondary'] },
    ],
    tooltipStyle: ['*'],
  },
})

describe('static-css', () => {
  test('works', () => {
    expect(getStyles(ctx)).toMatchInlineSnapshot(`
      {
        "css": [
          {
            "margin": {
              "base": "20px",
              "md": "20px",
              "sm": "20px",
            },
          },
          {
            "margin": {
              "base": "40px",
              "md": "40px",
              "sm": "40px",
            },
          },
          {
            "padding": {
              "base": "20px",
              "md": "20px",
              "sm": "20px",
            },
          },
          {
            "padding": {
              "base": "40px",
              "md": "40px",
              "sm": "40px",
            },
          },
          {
            "padding": {
              "base": "60px",
              "md": "60px",
              "sm": "60px",
            },
          },
          {
            "color": {
              "_dark": "red.200",
              "_light": "red.200",
              "base": "red.200",
            },
          },
          {
            "color": {
              "_dark": "blue.200",
              "_light": "blue.200",
              "base": "blue.200",
            },
          },
          {
            "color": {
              "_dark": "green.200",
              "_light": "green.200",
              "base": "green.200",
            },
          },
        ],
        "recipes": [
          {
            "buttonStyle": {
              "size": {
                "base": "sm",
                "md": "sm",
                "sm": "sm",
              },
            },
          },
          {
            "buttonStyle": {
              "size": {
                "base": "md",
                "md": "md",
                "sm": "md",
              },
            },
          },
          {
            "buttonStyle": {
              "variant": "primary",
            },
          },
          {
            "buttonStyle": {
              "variant": "secondary",
            },
          },
          {
            "tooltipStyle": {
              "base": {
                "base": {
                  "&[data-tooltip], & [data-tooltip]": {
                    "color": {
                      "_dark": "red",
                    },
                  },
                },
                "md": {
                  "&[data-tooltip], & [data-tooltip]": {
                    "color": {
                      "_dark": "red",
                    },
                  },
                },
                "sm": {
                  "&[data-tooltip], & [data-tooltip]": {
                    "color": {
                      "_dark": "red",
                    },
                  },
                },
              },
            },
          },
        ],
      }
    `)
  })

  test('using * as RecipeRule', () => {
    expect(
      getStaticCss({
        css: [],
        recipes: {
          buttonStyle: ['*'],
        },
      })(ctx),
    ).toMatchInlineSnapshot(`
      {
        "css": [],
        "recipes": [
          {
            "buttonStyle": {
              "size": {
                "base": "sm",
                "md": "sm",
                "sm": "sm",
              },
            },
          },
          {
            "buttonStyle": {
              "size": {
                "base": "md",
                "md": "md",
                "sm": "md",
              },
            },
          },
          {
            "buttonStyle": {
              "variant": {
                "base": "primary",
                "md": "primary",
                "sm": "primary",
              },
            },
          },
          {
            "buttonStyle": {
              "variant": {
                "base": "secondary",
                "md": "secondary",
                "sm": "secondary",
              },
            },
          },
        ],
      }
    `)
  })

  test('using * in CssRule', () => {
    expect(
      getStaticCss({
        css: [{ properties: { margin: ['*'] } }],
      })(ctx),
    ).toMatchInlineSnapshot(`
      {
        "css": [
          {
            "margin": "20px",
          },
          {
            "margin": "40px",
          },
        ],
        "recipes": [],
      }
    `)
  })

  test('using * in CssRule with responsive: true', () => {
    expect(
      getStaticCss({
        css: [{ properties: { padding: ['*'] }, responsive: true }],
      })(ctx),
    ).toMatchInlineSnapshot(`
      {
        "css": [
          {
            "padding": {
              "base": "20px",
              "md": "20px",
              "sm": "20px",
            },
          },
          {
            "padding": {
              "base": "40px",
              "md": "40px",
              "sm": "40px",
            },
          },
          {
            "padding": {
              "base": "60px",
              "md": "60px",
              "sm": "60px",
            },
          },
        ],
        "recipes": [],
      }
    `)
  })

  test('using * in CssRule with responsive: true and conditions list', () => {
    expect(
      getStaticCss({
        css: [{ properties: { color: ['*'] }, responsive: true, conditions: ['hover', 'focus'] }],
      })(ctx),
    ).toMatchInlineSnapshot(`
      {
        "css": [
          {
            "color": {
              "_focus": "red.200",
              "_hover": "red.200",
              "base": "red.200",
              "md": "red.200",
              "sm": "red.200",
            },
          },
          {
            "color": {
              "_focus": "blue.200",
              "_hover": "blue.200",
              "base": "blue.200",
              "md": "blue.200",
              "sm": "blue.200",
            },
          },
          {
            "color": {
              "_focus": "green.200",
              "_hover": "green.200",
              "base": "green.200",
              "md": "green.200",
              "sm": "green.200",
            },
          },
        ],
        "recipes": [],
      }
    `)
  })
})
