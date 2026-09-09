import { describe, expect, expectTypeOf, test } from 'vitest'
import { firstThatWorks, defineRecipe } from '@pandacss/dev'
import { css, firstThatWorks as firstThatWorksRuntime } from '../styled-system/css'

describe('firstThatWorks', () => {
  test('builds the value form, most-preferred first', () => {
    expect(firstThatWorks('min(60rem, 100%)', '75%')).toMatchInlineSnapshot(`"firstThatWorks(min(60rem, 100%), 75%)"`)
  })

  test('accepts three or more values', () => {
    expect(firstThatWorks('oklch(60% 0.2 30)', 'color(display-p3 1 0 0)', 'red')).toMatchInlineSnapshot(
      `"firstThatWorks(oklch(60% 0.2 30), color(display-p3 1 0 0), red)"`,
    )
  })

  test('accepts numeric values', () => {
    expect(firstThatWorks('1rem', 4)).toMatchInlineSnapshot(`"firstThatWorks(1rem, 4)"`)
  })

  test('keeps token references written for a config recipe', () => {
    expect(firstThatWorks('oklch(45% 0.16 250)', '{colors.blue.700}')).toMatchInlineSnapshot(
      `"firstThatWorks(oklch(45% 0.16 250), {colors.blue.700})"`,
    )
  })

  test('matches the generated firstThatWorks() for the same values', () => {
    expect(firstThatWorks('min(60rem, 100%)', '75%')).toBe(firstThatWorks('min(60rem, 100%)', '75%'))
    expect(firstThatWorks('1rem', 4)).toBe(firstThatWorks('1rem', 4))
  })
})

describe('firstThatWorks types', () => {
  test('requires at least two values', () => {
    // @ts-expect-error a run needs a value to fall back to
    expectTypeOf(firstThatWorks).toBeCallableWith('75%')
  })

  test('members take the property type, so its keywords autocomplete', () => {
    defineRecipe({
      className: 'probe',
      base: { position: firstThatWorks('sticky', 'fixed') },
    })
  })

  test('an arbitrary value is still allowed, as it is for any config value', () => {
    defineRecipe({
      className: 'probe',
      base: { color: firstThatWorks('oklch(45% 0.16 250)', '{colors.blue.700}') },
    })
  })

  test('members of differing types use the second overload', () => {
    defineRecipe({
      className: 'probe',
      base: { padding: firstThatWorks('clamp(1rem, 3vw, 2rem)', 4) },
    })
  })
})
