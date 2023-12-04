import { expect, test } from 'vitest'
import { createRecipeFn } from './fixture'

const recipe = createRecipeFn({
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
})

test('[recipe] direct nesting / recipe ruleset', () => {
  expect(recipe('text', { variant: 'sm' })).toMatchInlineSnapshot(`
    "@layer recipes {
        @layer _base {
            .text {
                margin-top: auto;
                margin-bottom: var(--spacing-0);
                padding-top: var(--spacing-0);
                object-pos: center;
            }
        }
        .text--variant_sm {
            &:first-child {
                margin-right: var(--spacing-4);
            }
            &:first-child:hover {
                color: var(--colors-red-200);
            }
            @media screen and (min-width: 48em) {
                &:first-child:hover {
                    color: var(--colors-gray-300);
                }
            }
            &:disabled {
                margin-right: 40px;
                filter: unset;
            }
        }
    }"
  `)

  expect(recipe('text', { variant: 'md' })).toMatchInlineSnapshot(`
    "@layer recipes {
        @layer _base {
            .text {
                margin-top: auto;
                margin-bottom: var(--spacing-0);
                padding-top: var(--spacing-0);
                object-pos: center
            }
        }
        .text--variant_md {
            &:before {
                --mb: var(--colors-gray-300)
        ;
                left: var(--spacing-5);
                border-bottom-right-radius: var(--radii-sm)
            }
            &:after {
                right: 90px;
                border-bottom-right-radius: var(--radii-lg);
                transform: scaleX(-1)
            }
        }
    }"
  `)
})
