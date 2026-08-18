import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import { applyConfigDefaults } from '@pandacss/compiler-shared'
import { createConfigSnapshot, mergeConfigs } from '@pandacss/config'
import type { UserConfig } from '@pandacss/types'
import { transform } from 'lightningcss'
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
  compiler.parseFileSource('/virtual/Prefix.tsx', `import { css } from '@panda/css'\n${source}`)
  return compiler.getLayerCss({ layers: ['utilities'] }).css
}

/** Chrome 120: modern enough that Lightning CSS should keep the unprefixed property. */
const CHROME_120 = { chrome: 120 << 16 }

function minify(css: string, targets = CHROME_120) {
  return transform({
    filename: 'in.css',
    code: Buffer.from(css),
    minify: true,
    targets,
  }).code.toString()
}

describe('lightningcss prefix-order bug', () => {
  it('drops unprefixed backdrop-filter when -webkit comes second', () => {
    expect(minify('.a{backdrop-filter:blur(1px);-webkit-backdrop-filter:blur(1px)}')).toMatchInlineSnapshot(
      `".a{-webkit-backdrop-filter:blur(1px)}"`,
    )
  })

  it('keeps unprefixed backdrop-filter when -webkit comes first', () => {
    expect(minify('.a{-webkit-backdrop-filter:blur(1px);backdrop-filter:blur(1px)}')).toMatchInlineSnapshot(
      `".a{backdrop-filter:blur(1px)}"`,
    )
  })
})

describe('preset prefix-first emit survives lightningcss', () => {
  it('emits -webkit-backdrop-filter before backdrop-filter, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ backdropFilter: 'blur(1px)' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .bkdp_blur\\(1px\\) {
          -webkit-backdrop-filter: blur(1px);
          backdrop-filter: blur(1px);
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(`"@layer utilities{.bkdp_blur\\(1px\\){backdrop-filter:blur(1px)}}"`)
  })

  it('emits -webkit-mask-image before mask-image, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ maskImage: 'url(/x.png)' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .msk-i_url\\(\\/x\\.png\\) {
          -webkit-mask-image: url(/x.png);
          mask-image: url(/x.png);
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(
      `"@layer utilities{.msk-i_url\\(\\/x\\.png\\){mask-image:url(/x.png)}}"`,
    )
  })

  it('emits -webkit-appearance before appearance, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ appearance: 'none' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .ap_none {
          -webkit-appearance: none;
          appearance: none;
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(`"@layer utilities{.ap_none{appearance:none}}"`)
  })

  it('emits -webkit-clip-path before clip-path, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ clipPath: 'circle()' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .cp-path_circle\\(\\) {
          -webkit-clip-path: circle();
          clip-path: circle();
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(`"@layer utilities{.cp-path_circle\\(\\){clip-path:circle()}}"`)
  })

  it('emits -webkit-background-clip before background-clip, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ backgroundClip: 'text' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg-cp_text {
          -webkit-background-clip: text;
          background-clip: text;
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(`"@layer utilities{.bg-cp_text{background-clip:text}}"`)
  })

  it('emits -webkit-user-select before user-select, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ userSelect: 'none' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .us_none {
          -webkit-user-select: none;
          user-select: none;
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(`"@layer utilities{.us_none{user-select:none}}"`)
  })

  it('emits -webkit-backface-visibility before backface-visibility, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ backfaceVisibility: 'hidden' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .bfv_hidden {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(`"@layer utilities{.bfv_hidden{backface-visibility:hidden}}"`)
  })

  it('emits -webkit-hyphens before hyphens, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ hyphens: 'auto' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .hy_auto {
          -webkit-hyphens: auto;
          hyphens: auto;
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(`"@layer utilities{.hy_auto{hyphens:auto}}"`)
  })

  it('emits -webkit-text-size-adjust before text-size-adjust, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ textSizeAdjust: '100%' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .txt-adj_100\\% {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(`"@layer utilities{.txt-adj_100\\%{text-size-adjust:100%}}"`)
  })

  it('emits -webkit-box-decoration-break before box-decoration-break, and lightningcss keeps both', () => {
    const emitted = utilitiesCss(`css({ boxDecorationBreak: 'clone' })`)
    expect(emitted).toMatchInlineSnapshot(`
      "@layer utilities {
        .bx-db_clone {
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
        }
      }
      "
    `)
    expect(minify(emitted)).toMatchInlineSnapshot(
      `"@layer utilities{.bx-db_clone{-webkit-box-decoration-break:clone;box-decoration-break:clone}}"`,
    )
  })
})
