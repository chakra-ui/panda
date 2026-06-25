import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import { applyConfigDefaults } from '@pandacss/compiler-shared'
import { createConfigSnapshot, mergeConfigs } from '@pandacss/config'
import type { UserConfig } from '@pandacss/types'
import { describe, expect, it } from 'vitest'
import { createCompilerFromSnapshot } from '../src'
import { importMap } from './test-utils'

function createPresetCompiler(overrides: Partial<UserConfig> = {}) {
  const merged = mergeConfigs([
    presetBase,
    presetPanda,
    {
      cwd: '/virtual',
      outdir: 'styled-system',
      importMap,
      ...overrides,
    },
  ]) as UserConfig
  const resolved = applyConfigDefaults(merged, '/virtual')
  const snapshot = createConfigSnapshot(resolved)
  return createCompilerFromSnapshot(snapshot, { crossFile: false })
}

function utilitiesCss(compiler: ReturnType<typeof createPresetCompiler>) {
  return compiler.getLayerCss({ layers: ['utilities'] }).css ?? ''
}

describe('staticCss.patterns (preset-base parity)', () => {
  it('generates circle size utilities through the pattern transform', () => {
    const compiler = createPresetCompiler({
      staticCss: {
        patterns: {
          circle: [{ properties: { size: ['40px'] } }],
        },
      },
    })

    expect(compiler.staticPatternAtoms().diagnostics).toEqual([])
    expect(utilitiesCss(compiler)).toMatchInlineSnapshot(`
      "@layer utilities {
        .bdr_9999px {
          border-radius: 9999px;
        }
        .flex_0_0_auto {
          flex: 0 0 auto;
        }
        .ai_center {
          align-items: center;
        }
        .d_flex {
          display: flex;
        }
        .jc_center {
          justify-content: center;
        }
        .h_40px {
          height: 40px;
        }
        .w_40px {
          width: 40px;
        }
      }
      "
    `)
  })

  it('generates aspectRatio utilities with nested selector styles', () => {
    const compiler = createPresetCompiler({
      staticCss: {
        patterns: {
          aspectRatio: [{ properties: { ratio: ['1.7777777778'] } }],
        },
      },
    })

    expect(compiler.staticPatternAtoms().diagnostics).toEqual([])
    expect(utilitiesCss(compiler)).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative;
        }
        .\\[\\&\\>\\*\\]\\:inset_0>* {
          inset: var(--spacing-0);
        }
        .\\[\\&\\>\\*\\]\\:ov_hidden>* {
          overflow: hidden;
        }
        .\\[\\&\\>\\*\\]\\:ai_center>* {
          align-items: center;
        }
        .\\[\\&\\>\\*\\]\\:d_flex>* {
          display: flex;
        }
        .\\[\\&\\>\\*\\]\\:jc_center>* {
          justify-content: center;
        }
        .\\[\\&\\>\\*\\]\\:pos_absolute>* {
          position: absolute;
        }
        .\\[\\&\\>\\*\\]\\:h_100\\%>* {
          height: 100%;
        }
        .\\[\\&\\>\\*\\]\\:w_100\\%>* {
          width: 100%;
        }
        .\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-f_cover>img, .\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-f_cover>video {
          object-fit: cover;
        }
        .before\\:content_\\"\\"::before {
          content: "";
        }
        .before\\:d_block::before {
          display: block;
        }
        .before\\:h_0::before {
          height: var(--sizes-0);
        }
        .before\\:pb_56\\.249999999296875\\%::before {
          padding-bottom: 56.249999999296875%;
        }
      }
      "
    `)
  })

  it('generates bleed utilities with token-resolved spacing values', () => {
    const compiler = createPresetCompiler({
      staticCss: {
        patterns: {
          bleed: [{ properties: { inline: ['4'] } }],
        },
      },
    })

    expect(compiler.staticPatternAtoms().diagnostics).toEqual([])
    expect(utilitiesCss(compiler)).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\--bleed-x_token\\(spacing\\.4\\,_4\\) {
          --bleed-x: var(--spacing-4, 4);
        }
        .\\--bleed-y_token\\(spacing\\.0\\,_0\\) {
          --bleed-y: var(--spacing-0, 0);
        }
        .mx_calc\\(var\\(--bleed-x\\,_0\\)_\\*_-1\\) {
          margin-inline: calc(var(--bleed-x, 0) * -1);
        }
        .my_calc\\(var\\(--bleed-y\\,_0\\)_\\*_-1\\) {
          margin-block: calc(var(--bleed-y, 0) * -1);
        }
      }
      "
    `)
  })

  it('expands stack gap wildcard values and applies literal defaultValues', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap,
          theme: {
            tokens: {
              spacing: {
                '4': { value: '1rem' },
                '8': { value: '2rem' },
              },
            },
          },
          utilities: {
            display: { className: 'd' },
            flexDirection: { className: 'fd' },
            gap: { className: 'gap', values: 'spacing' },
          },
          patterns: {
            stack: {
              properties: { gap: { type: 'property', value: 'gap' } },
              defaultValues: { direction: 'column', gap: '8px' },
              transform: { kind: 'js-callback', id: 'patterns.stack.transform' },
            },
          },
          staticCss: {
            patterns: { stack: [{ properties: { gap: ['*'] } }] },
          },
        },
        callbacks: {
          'pattern.transform': {
            'patterns.stack.transform': (props) => ({
              display: 'flex',
              flexDirection: props.direction,
              gap: props.gap,
            }),
          },
        },
      },
      { crossFile: false },
    )

    const { diagnostics, atoms } = compiler.staticPatternAtoms()
    expect(diagnostics).toEqual([])
    expect(atoms.some((atom) => atom.prop === 'flexDirection' && atom.value === 'column')).toBe(true)
    expect(atoms.some((atom) => atom.prop === 'display' && atom.value === 'flex')).toBe(true)
    expect(
      atoms
        .filter((atom) => atom.prop === 'gap')
        .map((atom) => atom.value)
        .sort(),
    ).toEqual([-4, -8, 4, 8])
    expect(utilitiesCss(compiler)).toMatchInlineSnapshot(`
      "@layer utilities {
        .gap_-4 {
          gap: calc(var(--spacing-4) * -1);
        }
        .gap_-8 {
          gap: calc(var(--spacing-8) * -1);
        }
        .gap_4 {
          gap: var(--spacing-4);
        }
        .gap_8 {
          gap: var(--spacing-8);
        }
        .d_flex {
          display: flex;
        }
        .fd_column {
          flex-direction: column;
        }
      }
      "
    `)
  })
})
