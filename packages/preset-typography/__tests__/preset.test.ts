import { describe, expect, test } from 'vitest'
import { createTypographyPreset, SIZES } from '../src'
import { assembleStyles } from '../src/styles'
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
      color: 'prose.link',
      textDecorationColor: 'prose.linkDecoration',
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
    expect(preset.theme?.extend?.recipes?.article?.base?.color).toBe('copy.body')
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
        p: { marginBlockStart: '1rem' },
        'h1, h2': { fontWeight: 'bold' },
      },
    })

    expect(styles).toEqual({
      color: 'red',
      '& p': { marginBlockStart: '1rem' },
      '& h1, & h2': { fontWeight: 'bold' },
    })
  })

  test('streamed content never restyles earlier blocks', () => {
    const recipe = createProseRecipe().prose
    const variants = Object.values(recipe.variants?.size ?? {}) as Record<string, unknown>[]
    const all = [recipe.base as Record<string, unknown>, ...variants]

    for (const styles of all) {
      for (const [selector, value] of Object.entries(styles)) {
        expect(selector).not.toMatch(/:last-child|:has\(|:empty|:nth-last/)
        if (typeof value === 'object' && value !== null) {
          expect(value).not.toHaveProperty('marginBlockEnd')
          expect(value).not.toHaveProperty('marginBlock')
        }
      }
    }
  })

  test('prose inherits the page font and only sets mono on code', () => {
    const base = createProseRecipe().prose.base as Record<string, Record<string, string>>
    expect(base.fontFamily).toBeUndefined()
    expect(base['& code']).toMatchObject({ fontFamily: 'mono' })
    expect(base['& pre']).toMatchObject({ fontFamily: 'mono' })
  })

  test('inline code is a pill on its own background; code inside pre is reset', () => {
    const base = createProseRecipe().prose.base as Record<string, Record<string, string>>
    expect(base['& code']).toMatchObject({
      backgroundColor: 'prose.codeBg',
      paddingInline: '0.3em',
      borderRadius: 'sm',
    })
    expect(base['& pre code']).toMatchObject({ backgroundColor: 'transparent', padding: '0' })
    expect(base['& pre']).toMatchObject({
      scrollbarWidth: 'thin',
      scrollbarColor: '{colors.prose.hrBorder} transparent',
    })
  })

  test('code blocks are a theme surface, not an inverted panel', () => {
    const colors = createTypographyPreset().theme?.extend?.semanticTokens?.colors?.prose as Record<
      string,
      { value: { base: string; _dark: string } }
    >
    expect(colors.preBg.value).toEqual({ base: '{colors.neutral.100}', _dark: '{colors.neutral.800}' })
    expect(colors.preCode.value).toEqual({ base: '{colors.neutral.800}', _dark: '{colors.neutral.200}' })
  })

  test('table body rows separate with a top border on following rows', () => {
    const base = createProseRecipe().prose.base as Record<string, Record<string, string>>
    expect(base['& tbody tr + tr']).toMatchObject({ borderTopWidth: '1px' })
    expect(base['& tbody tr']).toBeUndefined()
  })

  test('a size is one font size on the root; everything else is a ratio', () => {
    const recipe = createProseRecipe().prose
    const md = recipe.variants?.size?.md as Record<string, unknown>
    expect(md).toEqual({ fontSize: 'md' })
    expect(recipe.variants?.size?.['2xl']).toEqual({ fontSize: '2xl' })

    const base = recipe.base as Record<string, Record<string, string>>
    expect(base['& p']).toMatchObject({ marginBlockStart: 'var(--prose-flow)' })
    // 2.4 body-ems, divided by the heading's own 1.5em so the substituted `em` lands on the body size.
    expect(base['& h2']).toMatchObject({ fontSize: '1.5em', marginBlockStart: 'calc(var(--prose-flow) * 1.6)' })
    expect(base['& pre']).toMatchObject({ marginBlockStart: 'calc(var(--prose-flow) * 1.3714)' })
  })

  test('rhythm lives in two custom properties on the root', () => {
    const base = createProseRecipe().prose.base as Record<string, unknown>
    expect(base['--prose-leading']).toBe('1.625')
    expect(base['--prose-flow']).toBe('1.25em')
    expect(base.lineHeight).toBe('var(--prose-leading)')

    const named = createProseRecipe({ name: 'article' }).article.base as Record<string, unknown>
    expect(named['--article-flow']).toBe('1.25em')
  })

  test('no element uses rem, px, or a size token, so the article scales with its container', () => {
    const base = createProseRecipe().prose.base as Record<string, unknown>
    const offenders: string[] = []
    for (const [selector, value] of Object.entries(base)) {
      if (typeof value !== 'object' || value === null) continue
      for (const [prop, raw] of Object.entries(value as Record<string, string>)) {
        if (
          /^(fontSize|lineHeight|margin|padding)/.test(prop) &&
          /rem|px|\{(spacing|fontSizes|lineHeights)\./.test(String(raw))
        ) {
          offenders.push(`${selector} ${prop}: ${raw}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
