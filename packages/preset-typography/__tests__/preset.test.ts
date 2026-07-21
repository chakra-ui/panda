import { describe, expect, test } from 'vitest'
import { createTypographyPreset, SIZES } from '../src'
import { assembleStyles } from '../src/styles/assemble'
import { createProseRecipe } from '../src/recipe'

describe('@pandacss/preset-typography', () => {
  test('factory returns a named preset with prose recipe and semantic tokens', () => {
    const preset = createTypographyPreset()

    expect(preset.name).toBe('@pandacss/preset-typography')
    expect(preset.theme?.extend?.recipes?.prose).toMatchObject({
      className: 'prose',
      defaultVariants: { size: 'md' },
    })
    expect(Object.keys(preset.theme?.extend?.recipes?.prose?.variants?.size ?? {})).toEqual([...SIZES])
    const proseColors = preset.theme?.extend?.semanticTokens?.colors?.prose as {
      body: { value: { base: string; _dark: string } }
    }
    expect(proseColors.body.value).toEqual({
      base: '{colors.neutral.700}',
      _dark: '{colors.neutral.300}',
    })
  })

  test('link uses muted decoration; blockquote is not italic', () => {
    const recipe = createProseRecipe().prose
    const base = recipe.base as Record<string, Record<string, string>>

    expect(base['& a']).toMatchObject({
      color: '{colors.prose.link}',
      textDecorationColor: '{colors.prose.linkDecoration}',
      textDecorationThickness: '1px',
    })
    expect(base['& blockquote']).toMatchObject({
      fontStyle: 'normal',
      borderInlineStartWidth: '2px',
    })
  })

  test('size filtering and defaultSize', () => {
    const preset = createTypographyPreset({
      sizes: ['sm', 'lg'],
      defaultSize: 'lg',
    })

    const recipe = preset.theme?.extend?.recipes?.prose
    expect(Object.keys(recipe?.variants?.size ?? {})).toEqual(['sm', 'lg'])
    expect(recipe?.defaultVariants).toEqual({ size: 'lg' })
  })

  test('throws when defaultSize is missing from sizes', () => {
    expect(() => createTypographyPreset({ sizes: ['sm'], defaultSize: 'lg' })).toThrow(/defaultSize/)
  })

  test('throws when sizes is empty', () => {
    expect(() => createTypographyPreset({ sizes: [] })).toThrow(/at least one size/)
  })

  test('custom name, className, and semantic token options', () => {
    const preset = createTypographyPreset({
      name: 'article',
      className: 'rich-text',
      semanticTokens: { prefix: 'copy', colorPalette: 'gray' },
    })

    expect(preset.theme?.extend?.recipes?.article).toMatchObject({
      className: 'rich-text',
    })
    expect(preset.theme?.extend?.recipes?.prose).toBeUndefined()
    const copyColors = preset.theme?.extend?.semanticTokens?.colors?.copy as {
      body: { value: { base: string; _dark: string } }
    }
    expect(copyColors.body.value).toEqual({
      base: '{colors.gray.700}',
      _dark: '{colors.gray.300}',
    })
    expect(preset.theme?.extend?.recipes?.article?.base?.color).toBe('{colors.copy.body}')
  })

  test('semanticTokens.enabled: false omits color tokens', () => {
    const preset = createTypographyPreset({ semanticTokens: { enabled: false } })
    expect(preset.theme?.extend?.semanticTokens).toBeUndefined()
  })

  test('notProse wraps nested selectors', () => {
    const recipe = createProseRecipe({ notProse: true }).prose
    const keys = Object.keys(recipe.base ?? {})

    expect(keys.some((key) => key.includes(':where(a)') && key.includes('not-prose'))).toBe(true)
    expect(keys.some((key) => key === 'a' || key === '& a')).toBe(false)
  })

  test('custom notProse class string', () => {
    const recipe = createProseRecipe({ notProse: 'skip-prose' }).prose
    const keys = Object.keys(recipe.base ?? {})
    expect(keys.some((key) => key.includes('skip-prose'))).toBe(true)
  })

  test('assembleStyles nests selectors with &', () => {
    const styles = assembleStyles({
      root: { color: 'red' },
      elements: {
        p: { marginBlock: '1rem' },
        'h1, h2': { fontWeight: 'bold' },
      },
    })

    expect(styles).toEqual({
      color: 'red',
      '& p': { marginBlock: '1rem' },
      '& h1, & h2': { fontWeight: 'bold' },
    })
  })

  test('size variants only carry type-scale props', () => {
    const recipe = createProseRecipe().prose
    const md = recipe.variants?.size?.md as Record<string, unknown>
    expect(md.fontSize).toBe('{fontSizes.md}')
    expect(md.color).toBeUndefined()
    expect(md['& p']).toMatchObject({ marginBlock: '{spacing.5}' })
  })
})
