import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'
import type { Dict } from '@pandacss/types'

const css = (styles: Dict) => {
  const result = createRuleProcessor().css(styles)
  return { className: result.className, css: result.toCss() }
}

// adaptation of
// https://github.com/chakra-ui/panda/blob/42520626d978503f8465d8676dbacc859c7f1850/packages/core/__tests__/sort-mq.test.ts#L4

describe('sortStyleRules - sort-mq', () => {
  test('should sort media queries', () => {
    const result = css({
      '@media (min-width: 990px)': {
        '& .bg': {
          backgroundColor: 'yellow',
        },
      },
      '& .bg': {
        backgroundColor: 'red',
      },
      '@media (max-width: 1290px)': {
        '& .bg': {
          backgroundColor: 'yellow',
        },
      },
      '@media (min-width: 640px)': {
        '& .bg': {
          backgroundColor: 'blue',
        },
      },
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\\\[\\\\&_\\\\.bg\\\\]\\\\:bg_red .bg {
          background-color: red;
        }

        @media (width >= 640px) {
          .\\\\[\\\\@media_\\\\(min-width\\\\:_640px\\\\)\\\\]\\\\:\\\\[\\\\&_\\\\.bg\\\\]\\\\:bg_blue .bg {
            background-color: #00f;
          }
        }

        @media (width >= 990px) {
          .\\\\[\\\\@media_\\\\(min-width\\\\:_990px\\\\)\\\\]\\\\:\\\\[\\\\&_\\\\.bg\\\\]\\\\:bg_yellow .bg {
            background-color: #ff0;
          }
        }

        @media (width <= 1290px) {
          .\\\\[\\\\@media_\\\\(max-width\\\\:_1290px\\\\)\\\\]\\\\:\\\\[\\\\&_\\\\.bg\\\\]\\\\:bg_yellow .bg {
            background-color: #ff0;
          }
        }
      }
      "
    `)
  })

  test('should sort media queries', () => {
    const result = css({
      '@layer components': {
        '&.Button': {
          fontSize: '1rem',
        },
        '@media (min-width: 640px)': {
          '&.Button': {
            fontSize: '1.25rem',
          },
        },
        '&.Tabs': {
          display: 'flex',
          alignItems: 'center',
        },
      },
      '@layer base': {
        '@media (min-width: 1240px)': {
          py: '2',
        },
        py: '2',
        '@media (min-width: 900px)': {
          py: '2',
        },
      },
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        @layer base {
          @media (width >= 900px) {
            .\\\\[\\\\@layer_base\\\\]\\\\:\\\\[\\\\@media_\\\\(min-width\\\\:_900px\\\\)\\\\]\\\\:py_2 {
              padding-block: var(--spacing-2);
            }
          }

          @media (width >= 1240px) {
            .\\\\[\\\\@layer_base\\\\]\\\\:\\\\[\\\\@media_\\\\(min-width\\\\:_1240px\\\\)\\\\]\\\\:py_2 {
              padding-block: var(--spacing-2);
            }
          }
        }

        @layer components {
          .\\\\[\\\\@layer_components\\\\]\\\\:\\\\[\\\\&\\\\.Button\\\\]\\\\:fs_1rem.Button {
            font-size: 1rem;
          }

          .\\\\[\\\\@layer_components\\\\]\\\\:\\\\[\\\\&\\\\.Tabs\\\\]\\\\:d_flex.Tabs {
            display: flex;
          }

          .\\\\[\\\\@layer_components\\\\]\\\\:\\\\[\\\\&\\\\.Tabs\\\\]\\\\:items_center.Tabs {
            align-items: center;
          }

          @media (width >= 640px) {
            .\\\\[\\\\@layer_components\\\\]\\\\:\\\\[\\\\@media_\\\\(min-width\\\\:_640px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\.Button\\\\]\\\\:fs_1\\\\.25rem.Button {
              font-size: 1.25rem;
            }
          }
        }
      }
      "
    `)
  })

  test('should sort within nested @layer', () => {
    const result = css({
      py: 2,
      '@layer recipes': {
        '&.Button': {
          fontSize: '1rem',
        },
        '@layer compositions': {
          '@media (min-width: 640px)': {
            '&.Button': {
              fontSize: '1.25rem',
            },
          },
          '@media (min-width: 200px)': {
            '&.Button': {
              fontSize: '1.25rem',
            },
          },
          '&.Button': {
            fontSize: '1.2rem',
          },
        },
      },
      bg: 'red.500',
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .py_2 {
          padding-block: var(--spacing-2);
        }

        .bg_red\\\\.500 {
          background: var(--colors-red-500);
        }

        @layer recipes {
          .\\\\[\\\\@layer_recipes\\\\]\\\\:\\\\[\\\\&\\\\.Button\\\\]\\\\:fs_1rem.Button {
            font-size: 1rem;
          }

          @layer compositions {
            .\\\\[\\\\@layer_recipes\\\\]\\\\:\\\\[\\\\@layer_compositions\\\\]\\\\:\\\\[\\\\&\\\\.Button\\\\]\\\\:fs_1\\\\.2rem.Button {
              font-size: 1.2rem;
            }

            @media (width >= 200px) {
              .\\\\[\\\\@layer_recipes\\\\]\\\\:\\\\[\\\\@layer_compositions\\\\]\\\\:\\\\[\\\\@media_\\\\(min-width\\\\:_200px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\.Button\\\\]\\\\:fs_1\\\\.25rem.Button {
                font-size: 1.25rem;
              }
            }

            @media (width >= 640px) {
              .\\\\[\\\\@layer_recipes\\\\]\\\\:\\\\[\\\\@layer_compositions\\\\]\\\\:\\\\[\\\\@media_\\\\(min-width\\\\:_640px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\.Button\\\\]\\\\:fs_1\\\\.25rem.Button {
                font-size: 1.25rem;
              }
            }
          }
        }
      }
      "
    `)
  })
})

// adaptation of
// https://github.com/chakra-ui/panda/blob/42520626d978503f8465d8676dbacc859c7f1850/packages/core/__tests__/sort-css.test.ts

describe('sortStyleRules - sort-css', () => {
  test('root level', () => {
    const result = css({
      justifyContent: 'center',
      _hover: {
        color: 'red.200',
      },
      w: 5,
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .justify_center {
          justify-content: center;
        }

        .w_5 {
          width: var(--sizes-5);
        }

        .hover\\\\:text_red\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-red-200);
        }
      }
      "
    `)
  })

  test('@layer', () => {
    const result = css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      _hover: {
        color: 'red.200',
      },
      w: 5,
      h: 6,
      width: 12,
      height: 12,
      '&:hover': {
        backgroundColor: 'red.50',
      },
      animationName: 'red',
      borderRadius: '8px',
      rounded: '999px',
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex;
        }

        .items_center {
          align-items: center;
        }

        .justify_center {
          justify-content: center;
        }

        .w_12 {
          width: var(--sizes-12);
        }

        .h_12 {
          height: var(--sizes-12);
        }

        .animation-name_red {
          animation-name: red;
        }

        .rounded_999px {
          border-radius: 999px;
        }

        .hover\\\\:text_red\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-red-200);
        }

        .\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_red\\\\.50:hover {
          background-color: var(--colors-red-50);
        }
      }
      "
    `)
  })
})
