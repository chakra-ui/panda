import { expect, it } from 'vitest'

import { createCompiler } from '../src'
import { baseConfig, describeIfBuilt, describeMissingWasm } from './helpers'

describeIfBuilt('@pandacss/compiler-wasm build info', () => {
  it('round-trips build info through the wasm binding (produce → hydrate → CSS)', async () => {
    const lib = await createCompiler(baseConfig)
    lib.parseFileSource('button.tsx', "import { css } from '@panda/css'\ncss({ color: 'red' })")
    lib.parseFileSource('card.tsx', "import { css } from '@panda/css'\ncss({ background: 'blue' })")

    const info = lib.buildInfo.create({ panda: '^2.0.0' })
    expect(info.schemaVersion).toBeGreaterThan(0)
    expect(info.configFingerprint).toMatch(/^cfg1-/)
    expect(Object.keys(info.modules).sort()).toEqual(['button.tsx', 'card.tsx'])

    // Fresh consumer — no lib source parsed, only hydrated build info.
    const app = await createCompiler(baseConfig)
    expect(app.buildInfo.configFingerprint).toBe(info.configFingerprint)
    expect(app.buildInfo.validate(info)).toEqual({ ok: true })

    expect(app.buildInfo.hydrate(info, { name: '@acme/ds' })).toEqual({
      ok: true,
      modules: ['button.tsx', 'card.tsx'],
    })

    expect(app.layerCss(['utilities'])).toMatchInlineSnapshot(`
      "@layer utilities {
        .background_blue {
          background: blue;
        }
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  // Tree-shake to one imported module.
  it('tree-shakes build info to imported modules over the wasm binding', async () => {
    const lib = await createCompiler(baseConfig)
    lib.parseFileSource('button.tsx', "import { css } from '@panda/css'\ncss({ color: 'red' })")
    lib.parseFileSource('card.tsx', "import { css } from '@panda/css'\ncss({ background: 'blue' })")

    const info = lib.buildInfo.create({ panda: '^2.0.0' })

    const app = await createCompiler(baseConfig)
    expect(app.buildInfo.hydrate(info, { name: '@acme/ds', only: ['button.tsx'] }).modules).toEqual(['button.tsx'])

    // card's `background: blue` should not hydrate.
    expect(app.layerCss(['utilities'])).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  // Barrel export name → module key → selective recipe hydrate.
  it('emits exports for recipe-consuming components over the wasm binding', async () => {
    const lib = await createCompiler({
      ...baseConfig,
      theme: { recipes: { button: { jsx: ['Button'], base: { display: 'inline-flex' } } } },
    })
    lib.parseFileSource(
      'button.tsx',
      "import { Button } from './ui'\nexport function ActionButton() { return <Button /> }",
    )

    const info = lib.buildInfo.create({ panda: '^2.0.0' })
    expect(info.exports).toEqual({ ActionButton: 'button.tsx' })

    // Barrel name → module key → selective hydrate.
    const app = await createCompiler(baseConfig)
    const only = app.buildInfo.modulesFor(info, ['ActionButton'])
    expect(only).toEqual(['button.tsx'])

    app.buildInfo.hydrate(info, { name: '@acme/ds', only })

    expect(app.layerCss(['recipes'])).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer base {
          .button {
            display: inline-flex;
          }
        }
      }
      "
    `)
  })
})

describeMissingWasm()
