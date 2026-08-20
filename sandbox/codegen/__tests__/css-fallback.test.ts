import { describe, expect, expectTypeOf, test } from 'vitest'
import { cssFallback, defineRecipe } from '@pandacss/dev'
import { css } from '../styled-system/css'

describe('cssFallback', () => {
  test('builds the value form, most-preferred first', () => {
    expect(cssFallback('min(60rem, 100%)', '75%')).toMatchInlineSnapshot(`"fallback(min(60rem, 100%), 75%)"`)
  })

  test('accepts three or more values', () => {
    expect(cssFallback('oklch(60% 0.2 30)', 'color(display-p3 1 0 0)', 'red')).toMatchInlineSnapshot(
      `"fallback(oklch(60% 0.2 30), color(display-p3 1 0 0), red)"`,
    )
  })

  test('accepts numeric values', () => {
    expect(cssFallback('1rem', 4)).toMatchInlineSnapshot(`"fallback(1rem, 4)"`)
  })

  test('keeps token references written for a config recipe', () => {
    expect(cssFallback('oklch(45% 0.16 250)', '{colors.blue.700}')).toMatchInlineSnapshot(
      `"fallback(oklch(45% 0.16 250), {colors.blue.700})"`,
    )
  })

  test('matches the generated css.fallback() for the same values', () => {
    expect(cssFallback('min(60rem, 100%)', '75%')).toBe(css.fallback('min(60rem, 100%)', '75%'))
    expect(cssFallback('1rem', 4)).toBe(css.fallback('1rem', 4))
  })
})

describe('cssFallback types', () => {
  test('requires at least two values', () => {
    // @ts-expect-error a run needs a value to fall back to
    expectTypeOf(cssFallback).toBeCallableWith('75%')
  })

  test('members take the property type, so its keywords autocomplete', () => {
    defineRecipe({
      className: 'probe',
      base: { position: cssFallback('sticky', 'fixed') },
    })
  })

  test('an arbitrary value is still allowed, as it is for any config value', () => {
    defineRecipe({
      className: 'probe',
      base: { color: cssFallback('oklch(45% 0.16 250)', '{colors.blue.700}') },
    })
  })

  test('members of differing types use the second overload', () => {
    defineRecipe({
      className: 'probe',
      base: { padding: cssFallback('clamp(1rem, 3vw, 2rem)', 4) },
    })
  })
})
