import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import { applyConfigDefaults } from '@pandacss/compiler-shared'
import { createConfigSnapshot, mergeConfigs } from '@pandacss/config'
import type { UserConfig } from '@pandacss/types'
import { describe, expect, it } from 'vitest'
import { createCompilerFromSnapshot } from '../../src'
import { importMap } from '../test-utils'

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

function utilitiesCss(source: string) {
  const compiler = createPresetCompiler()
  compiler.parseFileSource('/virtual/Next.tsx', `import { css } from '@panda/css'\n${source}`)
  return compiler.getLayerCss({ layers: ['utilities'] }).css
}

describe('preset modern CSS follow-ups', () => {
  it('emits pointer media conditions', () => {
    expect(utilitiesCss(`css({ color: { _pointerFine: 'blue.500', _pointerCoarse: 'red.500' } })`))
      .toMatchInlineSnapshot(`
      "@layer utilities {
        @media (pointer: coarse) {
          .pointerCoarse\\:c_red\\.500 {
            color: var(--colors-red-500);
          }
        }
        @media (pointer: fine) {
          .pointerFine\\:c_blue\\.500 {
            color: var(--colors-blue-500);
          }
        }
      }
      "
    `)
  })

  it('emits any-pointer and pointer-none conditions', () => {
    expect(utilitiesCss(`css({ display: { _anyPointerFine: 'flex', _pointerNone: 'none' } })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        @media (any-pointer: fine) {
          .anyPointerFine\\:d_flex {
            display: flex;
          }
        }
        @media (pointer: none) {
          .pointerNone\\:d_none {
            display: none;
          }
        }
      }
      "
    `)
  })

  it('emits user-valid and user-invalid after interaction', () => {
    expect(utilitiesCss(`css({ borderColor: { _userValid: 'green.500', _userInvalid: 'red.500' } })`))
      .toMatchInlineSnapshot(`
      "@layer utilities {
        .userValid\\:bd-c_green\\.500:is(:user-valid, [data-user-valid]) {
          border-color: var(--colors-green-500);
        }
        .userInvalid\\:bd-c_red\\.500:is(:user-invalid, [data-user-invalid]) {
          border-color: var(--colors-red-500);
        }
      }
      "
    `)
  })

  it('emits inert', () => {
    expect(utilitiesCss(`css({ opacity: { _inert: '0.5' } })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .inert\\:op_0\\.5:is([inert], [data-inert]) {
          opacity: 0.5;
        }
      }
      "
    `)
  })

  it('emits safe alignment and last baseline as CSS keywords', () => {
    expect(utilitiesCss(`css({ justifyContent: 'safe center', alignItems: 'last baseline' })`)).toMatchInlineSnapshot(`
        "@layer utilities {
          .ai_last_baseline {
            align-items: last baseline;
          }
          .jc_safe_center {
            justify-content: safe center;
          }
        }
        "
      `)
  })
})
