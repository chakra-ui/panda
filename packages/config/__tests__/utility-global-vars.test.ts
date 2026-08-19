import type { CssPropertyDefinition, Config } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { mergeUtilityGlobalVars } from '../src/utility-global-vars'

const defineConfig = <T extends Config>(config: T) => config

const blur: CssPropertyDefinition = { syntax: '*', inherits: false }
const translateX: CssPropertyDefinition = { syntax: '<length-percentage>', inherits: false, initialValue: '0' }

function merge(config: Config) {
  return mergeUtilityGlobalVars(config as any) as any
}

describe('utility globalVars', () => {
  test('a utility registration reaches the config-level globalVars', () => {
    const result = merge(
      defineConfig({
        utilities: {
          blur: { className: 'blur', globalVars: { '--blur': blur } },
        },
      }),
    )

    expect(result.globalVars).toMatchInlineSnapshot(`
      {
        "--blur": {
          "inherits": false,
          "syntax": "*",
        },
      }
    `)
  })

  test('the registration is stripped off the utility once merged', () => {
    const result = merge(
      defineConfig({
        utilities: {
          blur: { className: 'blur', globalVars: { '--blur': blur } },
        },
      }),
    )

    expect(result.utilities.blur).toMatchInlineSnapshot(`
      {
        "className": "blur",
      }
    `)
  })

  test('a config-level @property object retunes a utility registration', () => {
    const retuned: CssPropertyDefinition = { syntax: '<length-percentage>', inherits: false, initialValue: '10px' }
    const result = merge(
      defineConfig({
        utilities: { translateX: { className: 'translate-x', globalVars: { '--translate-x': translateX } } },
        globalVars: { '--translate-x': retuned },
      }),
    )

    expect(result.globalVars['--translate-x']).toMatchInlineSnapshot(`
      {
        "inherits": false,
        "initialValue": "10px",
        "syntax": "<length-percentage>",
      }
    `)
  })

  test('two utilities sharing one definition merge without complaint', () => {
    const shared = { '--mask-linear': blur }
    const result = merge(
      defineConfig({
        utilities: {
          maskBottomFrom: { className: 'msk-b-from', globalVars: shared },
          maskTopFrom: { className: 'msk-t-from', globalVars: shared },
        },
      }),
    )

    expect(result.globalVars).toMatchInlineSnapshot(`
      {
        "--mask-linear": {
          "inherits": false,
          "syntax": "*",
        },
      }
    `)
  })

  test('two utilities registering the same name differently is an error', () => {
    expect(() =>
      merge(
        defineConfig({
          utilities: {
            blur: { className: 'blur', globalVars: { '--blur': blur } },
            blurry: { className: 'blurry', globalVars: { '--blur': { syntax: '<length>', inherits: false } } },
          },
        }),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Error: 💥 The \`blur\` and \`blurry\` utilities both register \`--blur\`, with different definitions.
      A CSS variable has one registration for the whole document, so share one definition between them.]
    `)
  })

  // A plain value shadowing a registration only matters if the stylesheet uses that
  // variable, which the emitter decides. Config records ownership and moves on.
  test('a plain value shadowing a registration is left for the emitter to judge', () => {
    const result = merge(
      defineConfig({
        utilities: { translateX: { className: 'translate-x', globalVars: { '--translate-x': translateX } } },
        globalVars: { '--translate-x': '10px' },
      }),
    )

    expect(result.globalVars['--translate-x']).toBe('10px')
    expect(result.utilityGlobalVars).toMatchInlineSnapshot(`
      {
        "--translate-x": "translateX",
      }
    `)
  })

  test('a config without utility registrations is returned untouched', () => {
    const config = defineConfig({
      utilities: { color: { className: 'c' } },
      globalVars: { '--brand': 'red' },
    })

    expect(merge(config)).toBe(config)
  })
})
