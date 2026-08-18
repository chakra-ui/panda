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
  compiler.parseFileSource('/virtual/Mask.tsx', `import { css } from '@panda/css'\n${source}`)
  return compiler.getLayerCss({ layers: ['utilities'] }).css
}

function baseCss(source: string) {
  const compiler = createPresetCompiler()
  compiler.parseFileSource('/virtual/Mask.tsx', `import { css } from '@panda/css'\n${source}`)
  return compiler.getLayerCss({ layers: ['base'] }).css
}

function registration(source: string, name: string) {
  return new RegExp(`@property ${name} \\{[^}]*\\}`).exec(baseCss(source))?.[0]
}

function registeredVars(source: string) {
  return Array.from(baseCss(source).matchAll(/@property (--[\w-]+)/g), (match) => match[1]).sort()
}

describe('preset mask utilities', () => {
  it('prefixes raw mask image and size', () => {
    expect(utilitiesCss(`css({ maskImage: 'url(/scribble.png)', maskSize: 'cover' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-i_url\\(\\/scribble\\.png\\) {
          -webkit-mask-image: url(/scribble.png);
          mask-image: url(/scribble.png);
        }
        .msk-s_cover {
          -webkit-mask-size: cover;
          mask-size: cover;
        }
      }
      "
    `)
  })

  it('emits a bottom edge fade from registered variables', () => {
    expect(utilitiesCss(`css({ maskBottomFrom: '20%' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-b-from_20\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-bottom: linear-gradient(to bottom, var(--mask-bottom-from-color) var(--mask-bottom-from-position), var(--mask-bottom-to-color) var(--mask-bottom-to-position));
          --mask-bottom-from-position: 20%;
        }
      }
      "
    `)
  })

  it('composes from and to stops on one edge', () => {
    expect(utilitiesCss(`css({ maskBottomFrom: '20%', maskBottomTo: '80%' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-b-from_20\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-bottom: linear-gradient(to bottom, var(--mask-bottom-from-color) var(--mask-bottom-from-position), var(--mask-bottom-to-color) var(--mask-bottom-to-position));
          --mask-bottom-from-position: 20%;
        }
        .msk-b-to_80\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-bottom: linear-gradient(to bottom, var(--mask-bottom-from-color) var(--mask-bottom-from-position), var(--mask-bottom-to-color) var(--mask-bottom-to-position));
          --mask-bottom-to-position: 80%;
        }
      }
      "
    `)
  })

  it('writes two edge layers for x fades', () => {
    expect(utilitiesCss(`css({ maskXFrom: '20%' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-x-from_20\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-left: linear-gradient(to left, var(--mask-left-from-color) var(--mask-left-from-position), var(--mask-left-to-color) var(--mask-left-to-position));
          --mask-right: linear-gradient(to right, var(--mask-right-from-color) var(--mask-right-from-position), var(--mask-right-to-color) var(--mask-right-to-position));
          --mask-left-from-position: 20%;
          --mask-right-from-position: 20%;
        }
      }
      "
    `)
  })

  it('stacks linear, radial, and conic layers', () => {
    expect(
      utilitiesCss(`css({
        maskLinear: '45deg',
        maskLinearFrom: '20%',
        maskRadialFrom: '40%',
        maskRadialAt: 'top left',
        maskRadialShape: 'circle',
        maskConic: '45deg',
        maskConicTo: '80%',
      })`),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-conic_45deg {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-conic-stops: from var(--mask-conic-position), var(--mask-conic-from-color) var(--mask-conic-from-position), var(--mask-conic-to-color) var(--mask-conic-to-position);
          --mask-conic: conic-gradient(var(--mask-conic-stops));
          --mask-conic-position: 45deg;
        }
        .msk-conic-to_80\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-conic-stops: from var(--mask-conic-position), var(--mask-conic-from-color) var(--mask-conic-from-position), var(--mask-conic-to-color) var(--mask-conic-to-position);
          --mask-conic: conic-gradient(var(--mask-conic-stops));
          --mask-conic-to-position: 80%;
        }
        .msk-linear_45deg {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear-stops: var(--mask-linear-position), var(--mask-linear-from-color) var(--mask-linear-from-position), var(--mask-linear-to-color) var(--mask-linear-to-position);
          --mask-linear: linear-gradient(var(--mask-linear-stops));
          --mask-linear-position: 45deg;
        }
        .msk-linear-from_20\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear-stops: var(--mask-linear-position), var(--mask-linear-from-color) var(--mask-linear-from-position), var(--mask-linear-to-color) var(--mask-linear-to-position);
          --mask-linear: linear-gradient(var(--mask-linear-stops));
          --mask-linear-from-position: 20%;
        }
        .msk-radial-at_top_left {
          --mask-radial-position: top left;
        }
        .msk-radial-from_40\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-radial-stops: var(--mask-radial-shape) var(--mask-radial-size) at var(--mask-radial-position), var(--mask-radial-from-color) var(--mask-radial-from-position), var(--mask-radial-to-color) var(--mask-radial-to-position);
          --mask-radial: radial-gradient(var(--mask-radial-stops));
          --mask-radial-from-position: 40%;
        }
        .msk-radial-shape_circle {
          --mask-radial-shape: circle;
        }
      }
      "
    `)
  })

  it('writes top and bottom layers for y fades', () => {
    expect(utilitiesCss(`css({ maskYFrom: '20%', maskYTo: '80%' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-y-from_20\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-top: linear-gradient(to top, var(--mask-top-from-color) var(--mask-top-from-position), var(--mask-top-to-color) var(--mask-top-to-position));
          --mask-bottom: linear-gradient(to bottom, var(--mask-bottom-from-color) var(--mask-bottom-from-position), var(--mask-bottom-to-color) var(--mask-bottom-to-position));
          --mask-top-from-position: 20%;
          --mask-bottom-from-position: 20%;
        }
        .msk-y-to_80\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-top: linear-gradient(to top, var(--mask-top-from-color) var(--mask-top-from-position), var(--mask-top-to-color) var(--mask-top-to-position));
          --mask-bottom: linear-gradient(to bottom, var(--mask-bottom-from-color) var(--mask-bottom-from-position), var(--mask-bottom-to-color) var(--mask-bottom-to-position));
          --mask-top-to-position: 80%;
          --mask-bottom-to-position: 80%;
        }
      }
      "
    `)
  })

  it('keeps per-edge stops independent', () => {
    const css = utilitiesCss(`css({
      maskTopFrom: '10%',
      maskRightFrom: '30%',
      maskBottomFrom: '50%',
      maskLeftFrom: '70%',
    })`)
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-b-from_50\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-bottom: linear-gradient(to bottom, var(--mask-bottom-from-color) var(--mask-bottom-from-position), var(--mask-bottom-to-color) var(--mask-bottom-to-position));
          --mask-bottom-from-position: 50%;
        }
        .msk-l-from_70\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-left: linear-gradient(to left, var(--mask-left-from-color) var(--mask-left-from-position), var(--mask-left-to-color) var(--mask-left-to-position));
          --mask-left-from-position: 70%;
        }
        .msk-r-from_30\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-right: linear-gradient(to right, var(--mask-right-from-color) var(--mask-right-from-position), var(--mask-right-to-color) var(--mask-right-to-position));
          --mask-right-from-position: 30%;
        }
        .msk-t-from_10\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-top: linear-gradient(to top, var(--mask-top-from-color) var(--mask-top-from-position), var(--mask-top-to-color) var(--mask-top-to-position));
          --mask-top-from-position: 10%;
        }
      }
      "
    `)
  })

  it('reads a bare maskLinear number as degrees', () => {
    expect(utilitiesCss(`css({ maskLinear: '45' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-linear_45 {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear-stops: var(--mask-linear-position), var(--mask-linear-from-color) var(--mask-linear-from-position), var(--mask-linear-to-color) var(--mask-linear-to-position);
          --mask-linear: linear-gradient(var(--mask-linear-stops));
          --mask-linear-position: 45deg;
        }
      }
      "
    `)
  })

  it('maps the maskLinear direction shortcuts', () => {
    expect(utilitiesCss(`css({ maskLinear: 'to-b' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-linear_to-b {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear-stops: var(--mask-linear-position), var(--mask-linear-from-color) var(--mask-linear-from-position), var(--mask-linear-to-color) var(--mask-linear-to-position);
          --mask-linear: linear-gradient(var(--mask-linear-stops));
          --mask-linear-position: to bottom;
        }
      }
      "
    `)
  })

  it('maps mask-composite to the webkit keyword', () => {
    expect(utilitiesCss(`css({ maskComposite: 'intersect' })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-cmp_intersect {
          --mask-composite: intersect;
          --mask-composite-webkit: source-in;
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
        }
      }
      "
    `)
  })

  it('changes only the hover stop on an x fade', () => {
    expect(utilitiesCss(`css({ maskXFrom: '25%', _hover: { maskXTo: '75%' } })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-x-from_25\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-left: linear-gradient(to left, var(--mask-left-from-color) var(--mask-left-from-position), var(--mask-left-to-color) var(--mask-left-to-position));
          --mask-right: linear-gradient(to right, var(--mask-right-from-color) var(--mask-right-from-position), var(--mask-right-to-color) var(--mask-right-to-position));
          --mask-left-from-position: 25%;
          --mask-right-from-position: 25%;
        }
        .hover\\:msk-x-to_75\\%:is(:hover, [data-hover]) {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-left: linear-gradient(to left, var(--mask-left-from-color) var(--mask-left-from-position), var(--mask-left-to-color) var(--mask-left-to-position));
          --mask-right: linear-gradient(to right, var(--mask-right-from-color) var(--mask-right-from-position), var(--mask-right-to-color) var(--mask-right-to-position));
          --mask-left-to-position: 75%;
          --mask-right-to-position: 75%;
        }
      }
      "
    `)
  })

  it('lets maskComposite win over the fade helpers regardless of class order', () => {
    // Every class emits the same `mask-composite` declaration, so only the variable decides.
    expect(utilitiesCss(`css({ maskBottomFrom: '50%', maskRadialFrom: '70%', maskComposite: 'add' })`))
      .toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-b-from_50\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-linear: var(--mask-left), var(--mask-right), var(--mask-bottom), var(--mask-top);
          --mask-bottom: linear-gradient(to bottom, var(--mask-bottom-from-color) var(--mask-bottom-from-position), var(--mask-bottom-to-color) var(--mask-bottom-to-position));
          --mask-bottom-from-position: 50%;
        }
        .msk-cmp_add {
          --mask-composite: add;
          --mask-composite-webkit: source-over;
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
        }
        .msk-radial-from_70\\% {
          -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
          -webkit-mask-composite: var(--mask-composite-webkit);
          mask-composite: var(--mask-composite);
          --mask-radial-stops: var(--mask-radial-shape) var(--mask-radial-size) at var(--mask-radial-position), var(--mask-radial-from-color) var(--mask-radial-from-position), var(--mask-radial-to-color) var(--mask-radial-to-position);
          --mask-radial: radial-gradient(var(--mask-radial-stops));
          --mask-radial-from-position: 70%;
        }
      }
      "
    `)
  })

  it('registers only the mask variables a bottom fade touches', () => {
    expect(registeredVars(`css({ maskBottomFrom: '50%' })`)).toMatchInlineSnapshot(`
      [
        "--mask-bottom",
        "--mask-bottom-from-color",
        "--mask-bottom-from-position",
        "--mask-bottom-to-color",
        "--mask-bottom-to-position",
        "--mask-composite",
        "--mask-composite-webkit",
        "--mask-conic",
        "--mask-left",
        "--mask-linear",
        "--mask-radial",
        "--mask-right",
        "--mask-top",
      ]
    `)
  })

  it('registers the stop variables as non-inheriting so a parent fade cannot leak into a child', () => {
    expect(registration(`css({ maskBottomFrom: '50%' })`, '--mask-bottom-from-position')).toMatchInlineSnapshot(`
      "@property --mask-bottom-from-position {
          syntax: '<length-percentage>';
          inherits: false;
          initial-value: 0%;
        }"
    `)
  })

  it('keeps the base layer free of mask registrations when nothing masks', () => {
    expect(baseCss(`css({ color: 'red.300' })`)).toMatchInlineSnapshot(`
      "@layer base {
        :root {
          --made-with-panda: '🐼';
        }
      }
      "
    `)
  })
})
