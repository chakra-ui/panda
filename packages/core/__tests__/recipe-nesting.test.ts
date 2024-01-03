import { expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'
import type { Config } from '@pandacss/types'

const config: Config = {
  theme: {
    extend: {
      recipes: {
        text: {
          className: 'text',
          base: {
            marginTop: 'auto',
            marginBottom: 0,
            paddingTop: 0,
            objectPos: 'center',
          },
          variants: {
            variant: {
              sm: {
                '&:first-child': {
                  marginRight: '4',
                  '&:hover': {
                    color: { base: 'red.200', md: 'gray.300' },
                  },
                },
                '&:disabled': {
                  marginRight: '40px',
                  filter: 'unset',
                },
              },
              md: {
                '&:before': {
                  '--mb': 'colors.gray.300',
                  left: '5',
                  borderBottomRightRadius: 'sm',
                },
                '&:after': {
                  right: 90,
                  borderBottomRightRadius: 'lg',
                  transform: 'scaleX(-1)',
                },
              },
            },
          },
        },
      },
    },
  },
}

function textRecipe(variants: Record<string, any> = {}) {
  return createRuleProcessor(config).recipe('text', variants)!.toCss()
}

test('[recipe] direct nesting / recipe ruleset', () => {
  expect(textRecipe({ variant: 'sm' })).toMatchInlineSnapshot(`
    "@layer recipes {
      .text--variant_sm:first-child {
        margin-right: var(--spacing-4);
    }

      .text--variant_sm:disabled {
        margin-right: 40px;
        filter: unset;
    }

      .text--variant_sm:first-child:hover {
        color: var(--colors-red-200);
    }

      @layer _base {
        .text {
          margin-top: auto;
          margin-bottom: var(--spacing-0);
          padding-top: var(--spacing-0);
          object-pos: center
    }
    }

      @media screen and (min-width: 48em) {
        .text--variant_sm:first-child:hover {
          color: var(--colors-gray-300);
        }
    }
    }"
  `)

  expect(textRecipe({ variant: 'md' })).toMatchInlineSnapshot(`
    "@layer recipes {
      .text--variant_md:before {
        --mb: var(--colors-gray-300)
        ;
        left: var(--spacing-5);
        border-bottom-right-radius: var(--radii-sm)
    }

      .text--variant_md:after {
        right: 90px;
        border-bottom-right-radius: var(--radii-lg);
        transform: scaleX(-1)
    }

      @layer _base {
        .text {
          margin-top: auto;
          margin-bottom: var(--spacing-0);
          padding-top: var(--spacing-0);
          object-pos: center
    }
    }
    }"
  `)
})
