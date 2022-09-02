import { describe, expect, test } from 'vitest'
import { RecipeSet } from '../src/recipe-set'
import type { ProcessOptions } from '../src/ruleset'
import { createContext } from './fixture'

function recipe(obj: ProcessOptions) {
  const ruleset = new RecipeSet(createContext(), {
    name: 'textStyle',
    base: {
      textAlign: 'center',
      textIndent: '2px',
    },
    variants: {
      variant: {
        h1: {
          fontSize: '2rem',
          lineHeight: '1.4',
        },
        h2: {
          fontSize: '1.5rem',
          lineHeight: '1.2',
        },
        h3: {
          fontSize: '1.25rem',
          lineHeight: '1.1',
        },
      },
    },
    defaultVariants: {
      variant: 'h2',
    },
  })

  return ruleset.resolve(obj).toCss()
}

describe('recipe ruleset', () => {
  test('should work with basic', () => {
    expect(recipe({ styles: { variant: 'h1' } })).toMatchInlineSnapshot(`
      ".textStyle {
          text-align: center;
          text-indent: 2px
      }
      .textStyle__variant-h1 {
          font-size: 2rem;
          line-height: 1.4
      }"
    `)

    expect(recipe({ styles: {} })).toMatchInlineSnapshot(`
      ".textStyle {
          text-align: center;
          text-indent: 2px
      }
      .textStyle__variant-h2 {
          font-size: 1.5rem;
          line-height: 1.2
      }"
    `)

    expect(recipe({ styles: { variant: { _: 'h1', md: 'h2' } } })).toMatchInlineSnapshot(`
      ".textStyle {
          text-align: center;
          text-indent: 2px
      }
      .textStyle__variant-h1 {
          font-size: 2rem;
          line-height: 1.4
      }
      @screen md {
          .md\\\\:textStyle__variant-h2 {
              font-size: 1.5rem;
              line-height: 1.2
          }
      }"
    `)
  })
})
