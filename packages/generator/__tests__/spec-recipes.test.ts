import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generateRecipesSpec } from '../src/spec/recipes'

describe('generateRecipesSpec', () => {
  test('should format boolean variant values correctly', () => {
    const ctx = createContext({
      theme: {
        recipes: {
          button: {
            className: 'button',
            base: {
              display: 'flex',
            },
            variants: {
              primary: {
                true: { backgroundColor: 'blue' },
                false: { backgroundColor: 'gray' },
              },
              disabled: {
                true: { opacity: 0.5 },
                false: { opacity: 1 },
              },
              size: {
                sm: { padding: '2' },
                lg: { padding: '4' },
              },
            },
          },
        },
      },
    })

    const spec = generateRecipesSpec(ctx)

    expect(spec.type).toBe('recipes')

    const buttonSpec = spec.data.find((recipe) => recipe.name === 'button')
    expect(buttonSpec).toBeDefined()
    if (!buttonSpec) return

    expect(buttonSpec.name).toBe('button')

    // Check function examples
    expect(buttonSpec.functionExamples).toMatchInlineSnapshot(`
      [
        "button({ primary: true })",
        "button({ disabled: true })",
        "button({ size: 'sm' })",
        "button({ primary: true, disabled: true, size: 'sm' })",
      ]
    `)

    // Check JSX examples
    expect(buttonSpec.jsxExamples).toMatchInlineSnapshot(`
      [
        "<Button primary={true} />",
        "<Button disabled={true} />",
        "<Button size="sm" />",
        "<Button primary={true} disabled={true} size="sm" />",
      ]
    `)
  })

  test('should handle recipe without boolean variants', () => {
    const ctx = createContext({
      theme: {
        recipes: {
          card: {
            className: 'card',
            base: {
              borderRadius: '4px',
            },
            variants: {
              variant: {
                solid: { backgroundColor: 'white' },
                outline: { border: '1px solid' },
              },
              size: {
                sm: { padding: '2' },
                lg: { padding: '4' },
              },
            },
          },
        },
      },
    })

    const spec = generateRecipesSpec(ctx)
    const cardSpec = spec.data.find((recipe) => recipe.name === 'card')
    expect(cardSpec).toBeDefined()
    if (!cardSpec) return

    // All examples should use quoted strings (no boolean variants)
    expect(cardSpec.functionExamples).toMatchInlineSnapshot(`
      [
        "card({ variant: 'solid' })",
        "card({ size: 'sm' })",
        "card({ variant: 'solid', size: 'sm' })",
      ]
    `)

    expect(cardSpec.jsxExamples).toMatchInlineSnapshot(`
      [
        "<Card variant="solid" />",
        "<Card size="sm" />",
        "<Card variant="solid" size="sm" />",
      ]
    `)
  })
})
