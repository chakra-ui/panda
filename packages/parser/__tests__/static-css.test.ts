import { parseAndExtract } from './fixture'

describe('static css', () => {
  test('recipe', () => {
    const { ctx } = parseAndExtract('', {
      theme: {
        extend: {
          recipes: {
            textStyle: {
              staticCss: [{ size: ['h1'] }],
            },
          },
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-start-width: 20px;
            border-inline-end-width: 0px;
      }

          .textStyle {
            font-family: var(--fonts-mono);
      }
      }

        .textStyle--size_h1 {
          font-size: 5rem;
          line-height: 1em;
          font-weight: 800;
      }
      }"
    `)
  })

  test('recipe with base', () => {
    const { ctx } = parseAndExtract('', {
      staticCss: {
        recipes: {
          tooltipStyle: [],
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          [data-theme=dark] .tooltipStyle[data-tooltip],.dark .tooltipStyle[data-tooltip],.tooltipStyle[data-tooltip].dark,.tooltipStyle[data-tooltip][data-theme=dark],[data-theme=dark] .tooltipStyle [data-tooltip],.dark .tooltipStyle [data-tooltip],.tooltipStyle [data-tooltip].dark,.tooltipStyle [data-tooltip][data-theme=dark] {
            color: red;
      }
          }
      }"
    `)
  })

  test('slot recipes', () => {
    const { ctx } = parseAndExtract('', {
      theme: {
        extend: {
          slotRecipes: {
            someRecipe: {
              staticCss: [{ size: ['sm'] }],
              className: 'button',
              slots: ['container', 'icon'],
              base: {
                container: {
                  fontFamily: 'mono',
                },
                icon: {
                  fontSize: '1.5rem',
                },
              },
              variants: {
                size: {
                  sm: {
                    container: {
                      fontSize: '5rem',
                      lineHeight: '1em',
                    },
                    icon: {
                      fontSize: '2rem',
                    },
                  },

                  md: {
                    container: {
                      fontSize: '3rem',
                      lineHeight: '1.2em',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const sheet = ctx.createSheet()
    ctx.appendCssOfType('static', sheet)
    const css = ctx.getCss(sheet)

    expect(css).toMatchInlineSnapshot(`
      "@layer recipes.slots {
        @layer _base {
          .button__container {
            font-family: var(--fonts-mono);
      }

          .button__icon {
            font-size: 1.5rem;
      }
      }

        .button__container--size_sm {
          font-size: 5rem;
          line-height: 1em;
      }

        .button__icon--size_sm {
          font-size: 2rem;
      }
      }"
    `)
  })
})
