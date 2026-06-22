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

describe('preset color mix utility output', () => {
  it('emits direct color-mix declarations for createColorMixTransform utilities', () => {
    const compiler = createPresetCompiler()

    compiler.parseFileSource(
      '/virtual/Button.tsx',
      `import { css } from '@panda/css'
       css({
         color: 'red.300/40',
         bg: 'red.300/40',
         borderColor: 'red.300/40',
         shadowColor: 'red.300/40',
         focusRingColor: 'red.300/40',
         gradientFrom: 'red.300/40',
         gradientTo: 'red.300/40',
         gradientVia: 'red.300/40',
         textShadowColor: 'red.300/40',
       })`,
    )

    const css = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(css).not.toContain('--mix-')
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.300\\/40 {
          background: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
        }
        .bd-c_red\\.300\\/40 {
          border-color: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
        }
        .bx-sh-c_red\\.300\\/40 {
          --shadow-color: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
        }
        .c_red\\.300\\/40 {
          color: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
        }
        .focus-ring-c_red\\.300\\/40 {
          --focus-ring-color-prop: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
        }
        .grad-from_red\\.300\\/40 {
          --gradient-from: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
        }
        .grad-to_red\\.300\\/40 {
          --gradient-to: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
        }
        .grad-via_red\\.300\\/40 {
          --gradient-via: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
          --gradient-stops: var(--gradient-via-stops);
          --gradient-via-stops: var(--gradient-position), var(--gradient-from) var(--gradient-from-position), var(--gradient-via) var(--gradient-via-position), var(--gradient-to) var(--gradient-to-position);
        }
        .tsh-c_red\\.300\\/40 {
          --text-shadow-color: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
        }
      }
      "
    `)
  })

  it('preserves color mix transform declarations in recipe output', () => {
    const compiler = createPresetCompiler({
      theme: {
        tokens: {
          colors: {
            border: {
              muted: { value: '#d4d4d8' },
            },
          },
        },
        recipes: {
          card: {
            className: 'card',
            variants: {
              variant: {
                elevated: {
                  boxShadowColor: 'border.muted',
                },
                tinted: {
                  boxShadowColor: 'red.300/40',
                },
              },
            },
          },
        },
      },
    })

    compiler.parseFileSource(
      '/virtual/Card.tsx',
      `import { card } from '@panda/recipes'
       card({ variant: 'elevated' })
       card({ variant: 'tinted' })`,
    )

    const css = compiler.getLayerCss({ layers: ['recipes'] }).css

    expect(css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer variants {
          .card--variant_elevated {
            --shadow-color: var(--colors-border-muted);
          }
          .card--variant_tinted {
            --shadow-color: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
          }
        }
      }
      "
    `)
  })
})
