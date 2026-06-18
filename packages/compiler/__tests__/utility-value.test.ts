import { describe, expect, it } from 'vitest'
import { createProject } from './test-utils'

describe('compiler.resolveUtilityValue()', () => {
  it('resolves value-map keys and authored literals', () => {
    const compiler = createProject({
      utilities: {
        marginBottom: {
          className: 'mb',
          shorthand: 'mb',
          values: {
            '2': '0.5rem',
            space: '0.5rem',
            '4': '1rem',
          },
        },
        minHeight: {
          className: 'min-h',
          values: {
            screen: '100vh',
          },
        },
      },
    })

    expect(compiler.resolveUtilityValue({ prop: 'mb', value: '2' })).toEqual({
      utility: 'marginBottom',
      className: 'mb_2',
      cssValue: '0.5rem',
      important: false,
      source: {
        type: 'value-map',
        key: '2',
        aliases: ['space'],
      },
    })

    expect(compiler.resolveUtilityValue({ prop: 'marginBottom', value: '0.5rem' })).toEqual({
      utility: 'marginBottom',
      className: 'mb_0.5rem',
      cssValue: '0.5rem',
      important: false,
      source: {
        type: 'literal',
        aliases: ['2', 'space'],
      },
    })

    expect(compiler.resolveUtilityValue({ prop: 'minHeight', value: '100vh' })).toMatchObject({
      utility: 'minHeight',
      className: 'min-h_100vh',
      cssValue: '100vh',
      source: {
        type: 'literal',
        aliases: ['screen'],
      },
    })
  })

  it('resolves arbitrary values, token references and important values', () => {
    const compiler = createProject({
      theme: {
        tokens: {
          colors: {
            red: {
              500: { value: '#f00' },
            },
          },
        },
      },
      utilities: {
        color: {
          className: 'c',
          values: 'colors',
        },
        width: {
          className: 'w',
        },
        zIndex: {
          className: 'z',
        },
      },
    })

    expect(compiler.resolveUtilityValue({ prop: 'width', value: '[calc(100% - 1rem)]' })).toEqual({
      utility: 'width',
      className: 'w_[calc(100%_-_1rem)]',
      cssValue: 'calc(100% - 1rem)',
      important: false,
      source: {
        type: 'arbitrary',
      },
    })

    expect(compiler.resolveUtilityValue({ prop: 'color', value: '{colors.red.500}' })).toMatchObject({
      utility: 'color',
      className: 'c_{colors.red.500}',
      cssValue: 'var(--colors-red-500)',
      source: {
        type: 'token-reference',
      },
    })

    expect(compiler.resolveUtilityValue({ prop: 'zIndex', value: '1002 !important' })).toMatchObject({
      utility: 'zIndex',
      className: 'z_1002!',
      cssValue: '1002',
      important: true,
      source: {
        type: 'literal',
        aliases: [],
      },
    })

    expect(compiler.resolveUtilityValue({ prop: 'width', value: { sm: '4px' } as any })).toBeNull()
  })

  it('resolves custom target properties and token category values', () => {
    const compiler = createProject({
      theme: {
        tokens: {
          colors: {
            red: {
              300: { value: '#fca5a5' },
            },
          },
        },
      },
      utilities: {
        boxShadowColor: {
          className: 'bx-sh-c',
          shorthand: 'shadowColor',
          values: 'colors',
          property: '--shadow-color',
        },
      },
    })

    expect(compiler.resolveUtilityValue({ prop: 'shadowColor', value: 'red.300/40' })).toEqual({
      utility: 'boxShadowColor',
      className: 'bx-sh-c_red.300/40',
      cssValue: 'color-mix(in oklab, var(--colors-red-300) 40%, transparent)',
      important: false,
      source: {
        type: 'literal',
        aliases: [],
      },
    })
  })

  it('uses configured prefix and separator for final class names', () => {
    const compiler = createProject({
      prefix: {
        className: 'pd',
      },
      separator: '__',
      utilities: {
        opacity: {
          className: 'op',
        },
      },
    })

    expect(compiler.resolveUtilityValue({ prop: 'opacity', value: 0.5 })).toEqual({
      utility: 'opacity',
      className: 'pd-op__0.5',
      cssValue: '0.5',
      important: false,
      source: {
        type: 'literal',
        aliases: [],
      },
    })
  })

  it('returns null for values that cannot form a utility class', () => {
    const compiler = createProject({
      utilities: {
        width: {
          className: 'w',
        },
        hideFrom: {
          className: 'hide',
          values: {
            sm: {
              '@breakpoint sm': {
                display: 'none',
              },
            },
          },
        },
      },
    } as any)

    expect(compiler.diagnostics()).toEqual([
      {
        code: 'config_utility_values_invalid',
        message:
          '`utilities.hideFrom.values` contains invalid entries: `sm`. Each value must be a string, number, or boolean. Return style objects from `utilities.hideFrom.transform` instead.',
        severity: 'warning',
      },
    ])

    expect(compiler.resolveUtilityValue({ prop: 'width', value: null })).toBeNull()
    expect(compiler.resolveUtilityValue({ prop: 'width', value: ['4px'] as any })).toBeNull()
    expect(compiler.resolveUtilityValue({ prop: 'width', value: { base: '4px' } as any })).toBeNull()
    expect(compiler.resolveUtilityValue({ prop: 'hideFrom', value: 'sm' })).toBeNull()
  })
})
