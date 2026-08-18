import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import { applyConfigDefaults } from '@pandacss/compiler-shared'
import { createConfigSnapshot, mergeConfigs } from '@pandacss/config'
import type { UserConfig } from '@pandacss/types'
import { describe, expect, it } from 'vitest'
import { createCompilerFromSnapshot } from '../../src'
import { importMap } from '../test-utils'

function compile(source: string) {
  const merged = mergeConfigs([
    presetBase,
    presetPanda,
    { cwd: '/virtual', outdir: 'styled-system', importMap },
  ]) as UserConfig
  const compiler = createCompilerFromSnapshot(createConfigSnapshot(applyConfigDefaults(merged, '/virtual')), {
    crossFile: false,
  })
  compiler.parseFileSource('/virtual/T.tsx', `import { css } from '@panda/css'\n${source}`)
  return compiler
}

const utilitiesCss = (source: string) => compile(source).getLayerCss({ layers: ['utilities'] }).css
const registration = (source: string, name: string) =>
  new RegExp(`@property ${name} \\{[^}]*\\}`).exec(compile(source).getLayerCss({ layers: ['base'] }).css)?.[0]

describe('preset transform utilities', () => {
  // The `rotate` property holds exactly one rotation, so two angles compute to `none` and a
  // single one is read as a 2D spin about Z. `auto` composes on `transform` instead.
  it('composes every rotate axis on transform', () => {
    expect(utilitiesCss(`css({ rotate: 'auto', rotateX: '45deg', rotateY: '30deg' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .rotate-x_45deg {
          --rotate-x: rotateX(45deg);
        }
        .rotate-y_30deg {
          --rotate-y: rotateY(30deg);
        }
        .rotate_auto {
          transform: var(--rotate-x,) var(--rotate-y,) var(--rotate-z,);
        }
      }
      "
    `)
  })

  it('keeps a plain angle on the rotate property', () => {
    expect(utilitiesCss(`css({ rotate: '45deg' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .rotate_45deg {
          rotate: 45deg;
        }
      }
      "
    `)
  })

  it('leaves a rotate axis inert until `rotate: auto` opts in', () => {
    expect(utilitiesCss(`css({ rotateX: '45deg' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .rotate-x_45deg {
          --rotate-x: rotateX(45deg);
        }
      }
      "
    `)
  })

  it('registers the rotate axes with no initial value so an unset one disappears', () => {
    expect(registration(`css({ rotate: 'auto', rotateX: '45deg' })`, '--rotate-x')).toMatchInlineSnapshot(`
      "@property --rotate-x {
          syntax: '*';
          inherits: false;
        }"
    `)
  })

  // `translate`'s third slot rejects a percentage, and a stray one takes x and y down with it.
  it('types the translate z axis as a length, not a length-percentage', () => {
    expect(registration(`css({ translate: 'auto-3d', translateZ: '2' })`, '--translate-z')).toMatchInlineSnapshot(`
      "@property --translate-z {
          syntax: '<length>';
          inherits: false;
          initial-value: 0;
        }"
    `)
  })

  it('resolves a translate z token to a length', () => {
    expect(utilitiesCss(`css({ translate: 'auto-3d', translateZ: '2' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .translate_auto-3d {
          translate: var(--translate-x) var(--translate-y) var(--translate-z);
        }
        .translate-z_2 {
          --translate-z: var(--spacing-2);
        }
      }
      "
    `)
  })

  it('still composes translate and scale on their own properties', () => {
    expect(utilitiesCss(`css({ translate: 'auto', translateX: '4', scale: 'auto', scaleX: '1.5' })`))
      .toMatchInlineSnapshot(`
        "@layer utilities {
          .scale-x_1\\.5 {
            --scale-x: 1.5;
          }
          .translate-x_4 {
            --translate-x: var(--spacing-4);
          }
          .scale_auto {
            scale: var(--scale-x) var(--scale-y);
          }
          .translate_auto {
            translate: var(--translate-x) var(--translate-y);
          }
        }
        "
      `)
  })
})
