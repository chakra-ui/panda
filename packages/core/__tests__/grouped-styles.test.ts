import type { Config, Dict } from '@pandacss/types'
import { createCss } from '@pandacss/shared'
import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'

const grouped = (styles: Dict, config?: Config) => {
  const result = createRuleProcessor(config).grouped(styles)
  return { className: result.getClassNames(), css: result.toCss() }
}

const atomic = (styles: Dict, config?: Config) => {
  const result = createRuleProcessor(config).css(styles)
  return { className: result.getClassNames(), css: result.toCss() }
}

describe('grouped styles', () => {
  test('produces a single class from multiple properties', () => {
    const result = grouped({
      color: 'red',
      fontSize: '14px',
      padding: '8px',
    })

    expect(result.className).toHaveLength(1)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .cmmQjj {
          padding: 8px;
          color: red;
          font-size: 14px;
      }
      }"
    `)
  })

  test('atomic produces multiple classes for same styles', () => {
    const result = atomic({
      color: 'red',
      fontSize: '14px',
      padding: '8px',
    })

    expect(result.className).toHaveLength(3)
  })

  test('handles conditions (hover, focus)', () => {
    const result = grouped({
      color: 'blue',
      _hover: {
        color: 'red',
      },
    })

    expect(result.className).toHaveLength(1)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .joqZiC {
          color: blue;
      }

        .joqZiC:is(:hover, [data-hover]) {
          color: red;
      }
      }"
    `)
  })

  test('handles responsive breakpoints', () => {
    const result = grouped({
      fontSize: 'sm',
      md: {
        fontSize: 'md',
      },
    })

    expect(result.className).toHaveLength(1)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .jzrzyw {
          font-size: var(--font-sizes-sm);
      }

        @media screen and (min-width: 48rem) {
          .jzrzyw {
            font-size: var(--font-sizes-md);
      }
      }
      }"
    `)
  })

  test('handles token values', () => {
    const result = grouped({
      color: 'blue.300',
      margin: 2,
    })

    expect(result.className).toHaveLength(1)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .jlIumF {
          margin: var(--spacing-2);
          color: var(--colors-blue-300);
      }
      }"
    `)
  })

  test('deduplicates identical style combinations', () => {
    const processor = createRuleProcessor()
    processor.clone()

    processor.grouped({ color: 'red', padding: '8px' })
    processor.grouped({ color: 'red', padding: '8px' })

    const css = processor.toCss()

    const classMatches = css.match(/\.\w+\s*\{/g) ?? []
    expect(classMatches).toHaveLength(1)
  })

  test('different styles produce different classes', () => {
    const processor = createRuleProcessor()
    processor.clone()

    processor.grouped({ color: 'red', padding: '8px' })
    processor.grouped({ color: 'blue', margin: '4px' })

    const css = processor.toCss()

    const classMatches = css.match(/\.\w+\s*\{/g) ?? []
    expect(classMatches).toHaveLength(2)
  })

  test('handles important values', () => {
    const result = grouped({
      color: 'red !important',
      padding: '8px',
    })

    expect(result.className).toHaveLength(1)
    expect(result.css).toContain('color: red !important')
    expect(result.css).toContain('padding: 8px')
  })

  test('handles shorthand properties', () => {
    const result = grouped({
      mx: '4',
      py: '2',
    })

    expect(result.className).toHaveLength(1)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .dFIQcS {
          margin-inline: var(--spacing-4);
          padding-block: var(--spacing-2);
      }
      }"
    `)
  })

  test('handles mixed conditions and base styles', () => {
    const result = grouped({
      display: 'flex',
      alignItems: 'center',
      gap: '4',
      _hover: {
        gap: '8',
      },
      md: {
        gap: '6',
      },
    })

    expect(result.className).toHaveLength(1)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .cZxNai {
          gap: var(--spacing-4);
          display: flex;
          align-items: center;
      }

        .cZxNai:is(:hover, [data-hover]) {
          gap: var(--spacing-8);
      }

        @media screen and (min-width: 48rem) {
          .cZxNai {
            gap: var(--spacing-6);
      }
      }
      }"
    `)
  })

  test('can be used alongside atomic styles', () => {
    const processor = createRuleProcessor()
    processor.clone()

    processor.css({ color: 'red' })
    processor.grouped({ display: 'flex', padding: '8px' })

    const css = processor.toCss()

    expect(css).toContain('.c_red')
    expect(css).toContain('display: flex')
    expect(css).toContain('padding: 8px')
  })

  test('serialization round-trip via toJSON/fromJSON', () => {
    const processor1 = createRuleProcessor()
    processor1.clone()
    processor1.encoder.processGrouped({ color: 'red', padding: '8px' })

    const json = processor1.encoder.toJSON()
    expect(json.styles.grouped).toBeDefined()

    const processor2 = createRuleProcessor()
    processor2.clone()
    processor2.encoder.fromJSON(json)
    processor2.decoder.collect(processor2.encoder)

    const css = processor2.toCss()
    expect(css).toContain('color: red')
    expect(css).toContain('padding: 8px')
  })
})

describe('groupedStyles config', () => {
  function createRuntimeCss(ctx: ReturnType<typeof createContext>) {
    return createCss({
      grouped: true,
      conditions: {
        shift: ctx.conditions.shift,
        finalize: ctx.conditions.finalize,
        breakpoints: { keys: ctx.conditions.breakpoints.keys },
      },
      utility: {
        prefix: ctx.utility.prefix,
        hasShorthand: ctx.utility.hasShorthand,
        resolveShorthand: ctx.utility.resolveShorthand.bind(ctx.utility),
        transform: ctx.utility.transform.bind(ctx.utility),
        toHash: ctx.utility.toHash.bind(ctx.utility),
      },
    })
  }

  test('runtime createCss with grouped: true returns a single class', () => {
    const ctx = createContext()
    const cssFn = createRuntimeCss(ctx)

    const result = cssFn({ color: 'red', fontSize: '14px', padding: '8px' })
    const classes = result.split(' ')

    expect(classes).toHaveLength(1)
  })

  test('runtime returns empty string for empty styles', () => {
    const ctx = createContext()
    const cssFn = createRuntimeCss(ctx)

    expect(cssFn({})).toBe('')
  })

  test('runtime returns same class for identical styles', () => {
    const ctx = createContext()
    const cssFn = createRuntimeCss(ctx)

    const a = cssFn({ color: 'red', padding: '8px' })
    const b = cssFn({ color: 'red', padding: '8px' })

    expect(a).toBe(b)
  })

  test('runtime returns different classes for different styles', () => {
    const ctx = createContext()
    const cssFn = createRuntimeCss(ctx)

    const a = cssFn({ color: 'red', padding: '8px' })
    const b = cssFn({ color: 'blue', margin: '4px' })

    expect(a).not.toBe(b)
  })

  test('runtime and build-time produce matching class names', () => {
    const ctx = createContext()
    const cssFn = createRuntimeCss(ctx)
    const processor = createRuleProcessor()
    processor.clone()

    const styles = { color: 'red', padding: '8px' }

    const runtimeClass = cssFn(styles)
    const buildClass = processor.grouped(styles).getClassNames()[0]

    expect(runtimeClass).toBe(buildClass)
  })

  test('runtime and build-time match with conditions', () => {
    const ctx = createContext()
    const cssFn = createRuntimeCss(ctx)
    const processor = createRuleProcessor()
    processor.clone()

    const styles = { color: 'blue', _hover: { color: 'red' } }

    const runtimeClass = cssFn(styles)
    const buildClass = processor.grouped(styles).getClassNames()[0]

    expect(runtimeClass).toBe(buildClass)
  })

  test('runtime and build-time match with responsive breakpoints', () => {
    const ctx = createContext()
    const cssFn = createRuntimeCss(ctx)
    const processor = createRuleProcessor()
    processor.clone()

    const styles = { fontSize: 'sm', md: { fontSize: 'md' } }

    const runtimeClass = cssFn(styles)
    const buildClass = processor.grouped(styles).getClassNames()[0]

    expect(runtimeClass).toBe(buildClass)
  })

  test('runtime and build-time match with shorthand properties', () => {
    const ctx = createContext()
    const cssFn = createRuntimeCss(ctx)
    const processor = createRuleProcessor()
    processor.clone()

    const styles = { mx: '4', py: '2' }

    const runtimeClass = cssFn(styles)
    const buildClass = processor.grouped(styles).getClassNames()[0]

    expect(runtimeClass).toBe(buildClass)
  })

  test('runtime and build-time match with mixed conditions', () => {
    const ctx = createContext()
    const cssFn = createRuntimeCss(ctx)
    const processor = createRuleProcessor()
    processor.clone()

    const styles = {
      display: 'flex',
      alignItems: 'center',
      gap: '4',
      _hover: { gap: '8' },
      md: { gap: '6' },
    }

    const runtimeClass = cssFn(styles)
    const buildClass = processor.grouped(styles).getClassNames()[0]

    expect(runtimeClass).toBe(buildClass)
  })
})
