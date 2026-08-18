import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import { applyConfigDefaults } from '@pandacss/compiler-shared'
import { createConfigSnapshot, mergeConfigs } from '@pandacss/config'
import type { UserConfig } from '@pandacss/types'
import { describe, expect, it } from 'vitest'
import { createCompilerFromSnapshot } from '../../src'
import { importMap } from '../test-utils'

function compile(source: string, overrides: Partial<UserConfig> = {}) {
  const merged = mergeConfigs([
    presetBase,
    presetPanda,
    { cwd: '/virtual', outdir: 'styled-system', importMap, ...overrides },
  ]) as UserConfig
  const compiler = createCompilerFromSnapshot(createConfigSnapshot(applyConfigDefaults(merged, '/virtual')), {
    crossFile: false,
  })
  compiler.parseFileSource('/virtual/Vars.tsx', `import { css } from '@panda/css'\n${source}`)
  return compiler
}

function baseCss(source: string, overrides: Partial<UserConfig> = {}) {
  return compile(source, overrides).getLayerCss({ layers: ['base'] }).css
}

function warnings(source: string, overrides: Partial<UserConfig> = {}) {
  const out = compile(source, overrides).getLayerCss({ layers: ['base'] })
  return (out.diagnostics ?? []).map((d: any) => `${d.severity}: ${d.message}`)
}

const WITH_FALLBACK = { optimize: { propertyFallback: true } } as Partial<UserConfig>

/** The `*, ::before, …` seeds, as `--name: value` pairs. */
function seededVars(source: string, overrides: Partial<UserConfig> = WITH_FALLBACK) {
  const block = /\*, ::before, ::after, ::backdrop \{([^}]*)\}/.exec(baseCss(source, overrides))
  return (block?.[1] ?? '')
    .split('\n')
    .map((line) => line.trim().replace(/;$/, ''))
    .filter(Boolean)
}

function registration(source: string, name: string) {
  const match = new RegExp(`@property ${name} \\{[^}]*\\}`).exec(baseCss(source))
  return match?.[0]
}

function registeredVars(source: string) {
  return Array.from(baseCss(source).matchAll(/@property (--[\w-]+)/g), (match) => match[1])
}

describe('preset utility variables', () => {
  it('leaves the base layer at the panda marker when nothing uses a utility variable', () => {
    expect(baseCss(`css({ color: 'red.300', padding: '4' })`)).toMatchInlineSnapshot(`
      "@layer base {
        :root {
          --made-with-panda: '🐼';
        }
      }
      "
    `)
  })

  it('registers only the transform variables the sheet references', () => {
    expect(registeredVars(`css({ translate: 'auto', translateX: '4' })`)).toMatchInlineSnapshot(`
      [
        "--translate-x",
        "--translate-y",
      ]
    `)
  })

  it('starts gradient stops transparent so a lone gradientTo does not fade from black', () => {
    expect(registration(`css({ bgGradient: 'to-r', gradientTo: 'blue.300' })`, '--gradient-from'))
      .toMatchInlineSnapshot(`
        "@property --gradient-from {
            syntax: '<color>';
            inherits: false;
            initial-value: #0000;
          }"
      `)
  })

  it('registers filter variables with no initial value, since they are read through a fallback', () => {
    expect(registration(`css({ filter: 'auto', blur: 'sm' })`, '--blur')).toMatchInlineSnapshot(`
      "@property --blur {
          syntax: '*';
          inherits: false;
        }"
    `)
  })

  it('registers the scroll snap strictness default that the reset used to provide', () => {
    expect(registration(`css({ scrollSnapType: 'x' })`, '--scroll-snap-strictness')).toMatchInlineSnapshot(`
      "@property --scroll-snap-strictness {
          syntax: '*';
          inherits: false;
          initial-value: proximity;
        }"
    `)
  })

  it('no longer ships the universal variable reset', () => {
    expect(baseCss(`css({ translate: 'auto' })`)).toMatchInlineSnapshot(`
      "@layer base {
        :root {
          --made-with-panda: '🐼';
        }
        @property --translate-x {
          syntax: '<length-percentage>';
          inherits: false;
          initial-value: 0;
        }
        @property --translate-y {
          syntax: '<length-percentage>';
          inherits: false;
          initial-value: 0;
        }
      }
      "
    `)
  })

  it('seeds no variable defaults unless propertyFallback is on', () => {
    expect(seededVars(`css({ maskBottomFrom: '50%' })`, {})).toMatchInlineSnapshot(`[]`)
  })

  it('seeds exactly the registrations that survived pruning when propertyFallback is on', () => {
    const seeded = seededVars(`css({ maskBottomFrom: '50%' })`)
    expect(seeded).toMatchInlineSnapshot(`
      [
        "--mask-linear: linear-gradient(#fff, #fff)",
        "--mask-radial: linear-gradient(#fff, #fff)",
        "--mask-conic: linear-gradient(#fff, #fff)",
        "--mask-left: linear-gradient(#fff, #fff)",
        "--mask-right: linear-gradient(#fff, #fff)",
        "--mask-bottom: linear-gradient(#fff, #fff)",
        "--mask-bottom-from-color: black",
        "--mask-bottom-to-color: transparent",
        "--mask-bottom-from-position: 0%",
        "--mask-bottom-to-position: 100%",
        "--mask-top: linear-gradient(#fff, #fff)",
        "--mask-composite: intersect",
        "--mask-composite-webkit: source-in",
      ]
    `)
    // the seeds and the registrations are the same set, whatever that set is
    expect(seeded.map((pair) => pair.split(':')[0]).sort()).toEqual(
      registeredVars(`css({ maskBottomFrom: '50%' })`).sort(),
    )
  })

  it('seeds nothing at all when the project uses no utility variables', () => {
    expect(baseCss(`css({ color: 'red.300' })`, WITH_FALLBACK)).toMatchInlineSnapshot(`
      "@layer base {
        :root {
          --made-with-panda: '🐼';
        }
      }
      "
    `)
  })

  // A registration with no initial value is guaranteed-invalid, and `initial` reproduces that on
  // engines that skip `@property` — so `filter: var(--blur, )` still collapses to nothing.
  it('seeds registrations without an initial value as `initial`', () => {
    expect(seededVars(`css({ filter: 'auto', blur: 'sm' })`)).toMatchInlineSnapshot(`
      [
        "--brightness: initial",
        "--contrast: initial",
        "--grayscale: initial",
        "--hue-rotate: initial",
        "--invert: initial",
        "--saturate: initial",
        "--sepia: initial",
        "--drop-shadow: initial",
        "--blur: initial",
      ]
    `)
  })

  // Reserving one of the preset's variable names is only a problem when the two actually
  // meet in the CSS, so the check lives at emit time rather than config load.
  it('says nothing when a config value shadows a registration the sheet never uses', () => {
    expect(
      warnings(`css({ color: 'red.300' })`, { globalVars: { '--blur': '4px' } } as Partial<UserConfig>),
    ).toMatchInlineSnapshot(`[]`)
  })

  it('warns when a config value shadows a registration the sheet does use', () => {
    expect(warnings(`css({ filter: 'auto', blur: 'sm' })`, { globalVars: { '--blur': '4px' } } as Partial<UserConfig>))
      .toMatchInlineSnapshot(`
        [
          "warning: globalVars \`--blur\` shadows the \`@property\` registration from the \`blur\` utility, and your CSS reads that variable. The registration is lost, so \`--blur\` starts inheriting and \`blur\` may misbehave. Pass an \`@property\` object instead of a plain value.",
        ]
      `)
  })

  it('says nothing when the config retunes a registration with an @property object', () => {
    expect(
      warnings(`css({ filter: 'auto', blur: 'sm' })`, {
        globalVars: { '--blur': { syntax: '*', inherits: false } },
      } as Partial<UserConfig>),
    ).toMatchInlineSnapshot(`[]`)
  })
})
