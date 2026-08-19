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
  compiler.parseFileSource('/virtual/Scrollbar.tsx', `import { css } from '@panda/css'\n${source}`)
  return compiler.getLayerCss({ layers: ['utilities'] }).css
}

describe('preset scrollbar utilities', () => {
  it('hides the scrollbar on standard and WebKit', () => {
    expect(utilitiesCss(`css({ scrollbar: 'hidden' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .scr-bar_hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scr-bar_hidden::-webkit-scrollbar {
          display: none;
        }
      }
      "
    `)
  })

  it('emits auto, thin, and none as standard scrollbar-width', () => {
    expect(utilitiesCss(`css({ scrollbarWidth: 'auto' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .scr-bar-w_auto {
          scrollbar-width: auto;
        }
      }
      "
    `)
    expect(utilitiesCss(`css({ scrollbarWidth: 'none' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .scr-bar-w_none {
          scrollbar-width: none;
        }
      }
      "
    `)
    expect(utilitiesCss(`css({ scrollbarWidth: 'thin' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .scr-bar-w_thin {
          scrollbar-width: thin;
        }
      }
      "
    `)
  })

  it('colors the thumb and keeps the track fallback', () => {
    expect(utilitiesCss(`css({ scrollbarThumb: 'gray.400' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .scr-bar-th_gray\\.400 {
          --scrollbar-thumb: var(--colors-gray-400);
          scrollbar-color: var(--scrollbar-thumb, currentColor) var(--scrollbar-track, transparent);
        }
        .scr-bar-th_gray\\.400::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb, currentColor);
        }
        .scr-bar-th_gray\\.400::-webkit-scrollbar-track {
          background-color: var(--scrollbar-track, transparent);
        }
      }
      "
    `)
  })

  it('composes thumb and track on the same scrollbar-color', () => {
    expect(utilitiesCss(`css({ scrollbarThumb: 'gray.400', scrollbarTrack: 'gray.100' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .scr-bar-th_gray\\.400 {
          --scrollbar-thumb: var(--colors-gray-400);
          scrollbar-color: var(--scrollbar-thumb, currentColor) var(--scrollbar-track, transparent);
        }
        .scr-bar-th_gray\\.400::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb, currentColor);
        }
        .scr-bar-th_gray\\.400::-webkit-scrollbar-track {
          background-color: var(--scrollbar-track, transparent);
        }
        .scr-bar-tk_gray\\.100 {
          --scrollbar-track: var(--colors-gray-100);
          scrollbar-color: var(--scrollbar-thumb, currentColor) var(--scrollbar-track, transparent);
        }
        .scr-bar-tk_gray\\.100::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb, currentColor);
        }
        .scr-bar-tk_gray\\.100::-webkit-scrollbar-track {
          background-color: var(--scrollbar-track, transparent);
        }
      }
      "
    `)
  })

  it('mixes thumb color opacity', () => {
    expect(utilitiesCss(`css({ scrollbarThumb: 'red.300/40' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .scr-bar-th_red\\.300\\/40 {
          --scrollbar-thumb: color-mix(in oklab, var(--colors-red-300) 40%, transparent);
          scrollbar-color: var(--scrollbar-thumb, currentColor) var(--scrollbar-track, transparent);
        }
        .scr-bar-th_red\\.300\\/40::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb, currentColor);
        }
        .scr-bar-th_red\\.300\\/40::-webkit-scrollbar-track {
          background-color: var(--scrollbar-track, transparent);
        }
      }
      "
    `)
  })

  it('emits stable both-edges as CSS', () => {
    expect(utilitiesCss(`css({ scrollbarGutter: 'stable both-edges' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .scr-bar-g_stable_both-edges {
          scrollbar-gutter: stable both-edges;
        }
      }
      "
    `)
  })

  it('passes scrollbarColor through as a two-value shorthand', () => {
    expect(utilitiesCss(`css({ scrollbarColor: 'red transparent' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .scr-bar-c_red_transparent {
          scrollbar-color: red transparent;
        }
      }
      "
    `)
  })
})
