import type { BuildInfoArtifact } from '@pandacss/compiler-shared'
import { describe, expect, it } from 'vitest'
import { createProject } from './test-utils'

// A "library" project that extracts two component modules.
function libBuildInfo(): BuildInfoArtifact {
  const lib = createProject({
    utilities: { padding: { className: 'p' }, margin: { className: 'm' } },
  })
  lib.parseFileSource('button.tsx', "import { css } from '@panda/css'\ncss({ color: 'red', padding: '4px' })")
  lib.parseFileSource('card.tsx', "import { css } from '@panda/css'\ncss({ color: 'red', margin: '8px' })")
  return lib.buildInfo.create({ panda: '^2.0.0' })
}

function withUnsupportedSchemaVersion(buildInfo: BuildInfoArtifact): BuildInfoArtifact {
  // One version ahead of the running binding — guaranteed incompatible.
  return {
    ...buildInfo,
    schemaVersion: buildInfo.schemaVersion + 1,
  }
}

const consumer = () => createProject({ utilities: { padding: { className: 'p' }, margin: { className: 'm' } } })

describe('compiler.buildInfo', () => {
  // --- Producer: serialize + validate ---

  it('create() serializes interned atoms + per-module provenance', () => {
    // `color: red` is shared, so it is interned once and referenced by both
    // modules; `padding`/`margin` are module-local.
    expect(libBuildInfo()).toMatchInlineSnapshot(`
      {
        "schemaVersion": 5,
        "panda": "^2.0.0",
        "configFingerprint": "cfg1-343a1d7a20956a6a",
        "strings": [
          "color",
          "red",
          "margin",
          "8px",
          "padding",
          "4px",
        ],
        "atoms": [
          {
            "p": 0,
            "v": 1,
          },
          {
            "p": 2,
            "v": 3,
          },
          {
            "p": 4,
            "v": 5,
          },
        ],
        "modules": {
          "button.tsx": {
            "atoms": [
              0,
              2,
            ],
          },
          "card.tsx": {
            "atoms": [
              0,
              1,
            ],
          },
        },
      }
    `)
  })

  it('validate() accepts a matching schema and reports a mismatch', () => {
    const app = consumer()
    expect(app.buildInfo.validate(libBuildInfo())).toEqual({ ok: true })
    expect(app.buildInfo.validate(withUnsupportedSchemaVersion(libBuildInfo()))).toEqual({
      ok: false,
      reason: 'schemaVersion',
    })
  })

  it('validate() and hydrate() report malformed artifacts as corrupt', () => {
    const app = consumer()
    const malformed = { schemaVersion: libBuildInfo().schemaVersion } as BuildInfoArtifact

    expect(app.buildInfo.validate(malformed)).toEqual({ ok: false, reason: 'corrupt' })
    expect(app.buildInfo.hydrate(malformed, { name: '@acme/ds' })).toEqual({
      ok: false,
      reason: 'corrupt',
      modules: [],
    })
  })

  it('create() preserves token identity alongside the resolved value', () => {
    // Build info keeps both the token path and the resolved value at extraction time.
    const lib = createProject({
      theme: {
        tokens: {
          colors: {
            red: {
              500: { value: '#ef4444' },
            },
          },
        },
      },
    })
    lib.parseFileSource(
      'button.tsx',
      "import { css } from '@panda/css'\nimport { token } from '@panda/tokens'\ncss({ color: token('colors.red.500') })",
    )

    const info = lib.buildInfo.create({ panda: '^2.0.0' })
    const value = info.atoms[0]?.v

    expect(typeof value === 'object' && value !== null && 't' in value && 'v' in value).toBe(true)
    if (typeof value !== 'object' || value === null || !('t' in value) || !('v' in value)) return
    expect(info.strings[value.t]).toBe('colors.red.500')
    expect(info.strings[value.v]).toBe('#ef4444')
  })

  it('hydrates module-scoped runtime token references for unused-token pruning', () => {
    const config = {
      optimize: { removeUnusedTokens: true },
      conditions: { dark: '.dark &' },
      theme: {
        tokens: {
          colors: {
            red: { value: '#f00' },
            blue: { value: '#00f' },
            green: { value: '#0f0' },
          },
        },
        semanticTokens: {
          colors: {
            fg: {
              value: {
                base: '{colors.red}',
                _dark: '{colors.blue}',
              },
            },
          },
        },
      },
    }
    const lib = createProject(config)
    lib.parseFileSource('fg.ts', "import { token } from '@panda/tokens'\nexport const fg = token('colors.fg')")
    lib.parseFileSource(
      'green.ts',
      "import { token } from '@panda/tokens'\nexport const green = token.var('colors.green')",
    )
    const info = lib.buildInfo.create({ panda: '^2.0.0' })

    expect(info.tokenRefs?.map((index) => info.strings[index])).toEqual(['colors.fg', 'colors.green'])
    expect(info.modules).toEqual({
      'fg.ts': { tokenRefs: [0] },
      'green.ts': { tokenRefs: [1] },
    })
    expect(info.exports).toEqual({ fg: 'fg.ts', green: 'green.ts' })

    const app = createProject(config)
    const only = app.buildInfo.modulesFor(info, ['fg'])
    expect(only).toEqual(['fg.ts'])
    expect(app.buildInfo.hydrate(info, { name: '@acme/ds', only })).toEqual({ ok: true, modules: ['fg.ts'] })
    expect(app.getLayerCss({ layers: ['tokens'] }).css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(:root, :host) {
          --colors-red: #f00;
          --colors-blue: #00f;
          --colors-fg: var(--colors-red);
        }
        .dark {
          --colors-fg: var(--colors-blue);
        }
      }
      "
    `)
  })

  // --- Consumer: hydrate + tree-shake ---

  it('hydrates token-backed build info against the consumer theme', () => {
    // Lib extracts with one token value; consumer hydrates with another for the same path.
    const lib = createProject({
      utilities: { color: { className: 'color', values: 'colors' } },
      theme: {
        tokens: {
          colors: {
            brand: {
              500: { value: '#ef4444' },
            },
          },
        },
      },
    })
    lib.parseFileSource('button.tsx', "import { css } from '@panda/css'\ncss({ color: 'brand.500' })")

    const info = lib.buildInfo.create({ panda: '^2.0.0' })

    const app = createProject({
      utilities: { color: { className: 'color', values: 'colors' } },
      theme: {
        tokens: {
          colors: {
            brand: {
              500: { value: '#3b82f6' },
            },
          },
        },
      },
    })

    expect(app.buildInfo.hydrate(info, { name: '@acme/ds' })).toEqual({
      ok: true,
      modules: ['button.tsx'],
    })

    // Utilities keep the token var; the consumer token layer supplies the final value.
    const utilities = app.getLayerCss({ layers: ['utilities'] }).css
    const tokens = app.getLayerCss({ layers: ['tokens'] }).css

    expect(utilities).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_brand\\.500 {
          color: var(--colors-brand-500);
        }
      }
      "
    `)
    expect(tokens).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(:root, :host) {
          --colors-brand-500: #3b82f6;
        }
      }
      "
    `)
  })

  it('exposes the engine config fingerprint, matching the artifact', () => {
    const app = consumer()
    // The consumer was built with the same config as the lib, so the fingerprints
    // match — the host's signal that the two sides are config-compatible.
    expect(app.buildInfo.configFingerprint).toMatch(/^cfg1-/)
    expect(app.buildInfo.configFingerprint).toBe(libBuildInfo().configFingerprint)
  })

  it('hydrate() applies every atom into a consumer (full)', () => {
    const app = consumer()
    const result = app.buildInfo.hydrate(libBuildInfo(), { name: '@acme/ds' })
    expect(result).toEqual({ ok: true, modules: ['button.tsx', 'card.tsx'] })
    expect(app.getLayerCss({ layers: ['utilities'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .m_8px {
          margin: 8px;
        }
        .p_4px {
          padding: 4px;
        }
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  // --- Barrel exports → module keys ---

  it('modulesFor() resolves barrel export names to module keys', () => {
    const app = consumer()
    // `panda lib` adds the export→module map; simulate it here.
    const info = { ...libBuildInfo(), exports: { Button: 'button.tsx', Card: 'card.tsx' } }

    expect(app.buildInfo.modulesFor(info, ['Button', 'Unknown'])).toEqual(['button.tsx'])

    // Resolve a barrel import to its module, then hydrate only that.
    const only = app.buildInfo.modulesFor(info, ['Button'])
    expect(app.buildInfo.hydrate(info, { name: '@acme/ds', only }).modules).toEqual(['button.tsx'])
    expect(app.getLayerCss({ layers: ['utilities'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .p_4px {
          padding: 4px;
        }
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  it('normalize() rewrites module keys and export references together', () => {
    const app = consumer()
    const source = libBuildInfo()
    const info = {
      ...source,
      modules: Object.fromEntries(Object.entries(source.modules).map(([key, entry]) => [`/repo/lib/${key}`, entry])),
      exports: { Button: '/repo/lib/button.tsx', Card: '/repo/lib/card.tsx' },
    }

    const normalized = app.buildInfo.normalize(info, {
      mapModuleKey: (key) => key.replace('/repo/lib/', ''),
    })

    expect(normalized.modules).toEqual({
      'button.tsx': { atoms: [0, 2] },
      'card.tsx': { atoms: [0, 1] },
    })
    expect(normalized.exports).toEqual({ Button: 'button.tsx', Card: 'card.tsx' })
  })

  it('emits exports for recipe-consuming components, resolvable by name to recipe CSS', () => {
    // A design-system module whose exported component consumes a config recipe.
    const lib = createProject({
      theme: {
        recipes: {
          button: {
            jsx: ['Button'],
            base: { display: 'inline-flex' },
            variants: { size: { sm: { fontSize: '12px' } } },
          },
        },
      },
    })
    lib.parseFileSource(
      'button.tsx',
      "import { Button } from './ui'\nexport function ActionButton() { return <Button size='sm' /> }",
    )
    const info = lib.buildInfo.create({ panda: '^2.0.0' })

    // The engine populated the export→module map — no manual simulation.
    expect(info.exports).toEqual({ ActionButton: 'button.tsx' })

    // A bare consumer (no recipe config) resolves the barrel name, hydrates only
    // that module, and gets the recipe CSS — fully self-contained.
    const app = createProject({})
    const only = app.buildInfo.modulesFor(info, ['ActionButton'])
    expect(only).toEqual(['button.tsx'])
    expect(app.buildInfo.hydrate(info, { name: '@acme/ds', only }).modules).toEqual(['button.tsx'])
    expect(app.getLayerCss({ layers: ['recipes'] }).css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer base {
          .button {
            display: inline-flex;
          }
        }
        @layer variants {
          .button--size_sm {
            font-size: 12px;
          }
        }
      }
      "
    `)
  })

  // --- JSX style props → atoms through hydrate ---

  it('hydrates JSX style props into consumer utilities CSS', () => {
    const lib = createProject({})
    lib.parseFileSource(
      'card.tsx',
      "import { Box } from '@panda/jsx'\nexport const Card = () => <Box color='red' padding='4px' />",
    )
    const info = lib.buildInfo.create({ panda: '^2.0.0' })

    const app = createProject({})
    expect(app.buildInfo.hydrate(info, { name: '@acme/ds' })).toEqual({
      ok: true,
      modules: ['card.tsx'],
    })
    expect(app.getLayerCss({ layers: ['utilities'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .padding_4px {
          padding: 4px;
        }
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  it('tree-shakes JSX style props to the imported module', () => {
    const lib = createProject({})
    lib.parseFileSource('card.tsx', "import { Box } from '@panda/jsx'\nexport const Card = () => <Box color='red' />")
    lib.parseFileSource(
      'panel.tsx',
      "import { Box } from '@panda/jsx'\nexport const Panel = () => <Box padding='8px' />",
    )
    const info = lib.buildInfo.create({ panda: '^2.0.0' })

    const app = createProject({})
    expect(app.buildInfo.hydrate(info, { name: '@acme/ds', only: ['card.tsx'] })).toEqual({
      ok: true,
      modules: ['card.tsx'],
    })
    expect(app.getLayerCss({ layers: ['utilities'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  it('hydrates recipe JSX with extra atomic style props on the same tag', () => {
    const lib = createProject({
      theme: {
        recipes: {
          button: {
            jsx: ['Button'],
            base: { display: 'inline-flex' },
            variants: { size: { sm: { fontSize: '12px' } } },
          },
        },
      },
    })
    lib.parseFileSource(
      'button.tsx',
      "import { Button } from './ui'\nexport const View = () => <Button size='sm' color='red' />",
    )
    const info = lib.buildInfo.create({ panda: '^2.0.0' })

    const app = createProject({})
    expect(app.buildInfo.hydrate(info, { name: '@acme/ds' })).toEqual({
      ok: true,
      modules: ['button.tsx'],
    })
    expect(app.getLayerCss({ layers: ['utilities'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_red {
          color: red;
        }
      }
      "
    `)
    expect(app.getLayerCss({ layers: ['recipes'] }).css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer base {
          .button {
            display: inline-flex;
          }
        }
        @layer variants {
          .button--size_sm {
            font-size: 12px;
          }
        }
      }
      "
    `)
  })

  it('hydrate() reports only the modules that actually exist', () => {
    const app = consumer()
    // `ghost.tsx` isn't in the artifact — the result must not claim to hydrate it.
    const result = app.buildInfo.hydrate(libBuildInfo(), { name: '@acme/ds', only: ['button.tsx', 'ghost.tsx'] })
    expect(result).toEqual({ ok: true, modules: ['button.tsx'] })
  })

  it('hydrate() tree-shakes to the imported modules', () => {
    const app = consumer()
    const result = app.buildInfo.hydrate(libBuildInfo(), { name: '@acme/ds', only: ['button.tsx'] })
    expect(result).toEqual({ ok: true, modules: ['button.tsx'] })
    // card's `margin` is absent — only the imported `button` module hydrated.
    expect(app.getLayerCss({ layers: ['utilities'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .p_4px {
          padding: 4px;
        }
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  // A library shipping two recipes, each used from a distinct module so recipe
  // provenance is per-file (and thus tree-shakeable).
  function recipeLibBuildInfo(): BuildInfoArtifact {
    const lib = createProject({
      theme: {
        recipes: {
          button: { base: { display: 'inline-flex' }, variants: { size: { sm: { fontSize: '12px' } } } },
        },
        slotRecipes: {
          tabs: { slots: ['root'], variants: { size: { sm: { root: { gap: '4px' } } } } },
        },
      },
    })
    lib.parseFileSource('button.tsx', "import { button } from '@panda/recipes'\nbutton({ size: 'sm' })")
    lib.parseFileSource('tabs.tsx', "import { tabs } from '@panda/recipes'\ntabs({ size: 'sm' })")
    return lib.buildInfo.create({ panda: '^2.0.0' })
  }

  const recipeConsumer = () =>
    createProject({
      theme: {
        recipes: {
          button: { base: { display: 'inline-flex' }, variants: { size: { sm: { fontSize: '12px' } } } },
        },
        slotRecipes: {
          tabs: { slots: ['root'], variants: { size: { sm: { root: { gap: '4px' } } } } },
        },
      },
    })

  // --- Config recipes (keyed snapshot path) ---

  it('create() carries interned recipes with per-module provenance', () => {
    const info = recipeLibBuildInfo()
    expect(info.recipes).toMatchInlineSnapshot(`
      {
        "base": [
          {
            "r": 0,
            "cls": 0,
            "entries": [
              {
                "p": 1,
                "v": 2,
              },
            ],
          },
        ],
        "variants": [
          {
            "r": 0,
            "cls": 3,
            "entries": [
              {
                "p": 4,
                "v": 5,
              },
            ],
          },
          {
            "r": 6,
            "slot": 7,
            "cls": 8,
            "entries": [
              {
                "p": 9,
                "v": 10,
              },
            ],
          },
        ],
      }
    `)
    expect(info.modules).toEqual({
      'button.tsx': { recipes: [0, 1] },
      'tabs.tsx': { recipes: [2] },
    })
  })

  it('hydrate() reproduces recipe CSS byte-for-byte', () => {
    const lib = recipeConsumer()
    lib.parseFileSource('button.tsx', "import { button } from '@panda/recipes'\nbutton({ size: 'sm' })")
    lib.parseFileSource('tabs.tsx', "import { tabs } from '@panda/recipes'\ntabs({ size: 'sm' })")
    const reference = lib.getLayerCss({ layers: ['recipes'] }).css

    // A bare consumer (no source using the recipes) hydrates the lib's recipes.
    const app = createProject({
      theme: {
        recipes: {
          button: { base: { display: 'inline-flex' }, variants: { size: { sm: { fontSize: '12px' } } } },
        },
        slotRecipes: {
          tabs: { slots: ['root'], variants: { size: { sm: { root: { gap: '4px' } } } } },
        },
      },
    })
    expect(app.getLayerCss({ layers: ['recipes'] }).css).toBe('')
    const result = app.buildInfo.hydrate(recipeLibBuildInfo(), { name: '@acme/ds' })
    expect(result).toEqual({ ok: true, modules: ['button.tsx', 'tabs.tsx'] })
    expect(app.getLayerCss({ layers: ['recipes'] }).css).toBe(reference)
  })

  it('emits parent and child design-system recipes before app overrides', () => {
    const recipeInfo = (color: string) => {
      const project = createProject({ theme: { recipes: { button: { base: { color } } } } })
      project.parseFileSource('button.tsx', "import { button } from '@panda/recipes'\nbutton()")
      return project.buildInfo.create({ panda: '^2.0.0' })
    }
    const app = createProject({ theme: { recipes: { button: { base: { color: 'blue' } } } } })
    app.parseFileSource('app.tsx', "import { button } from '@panda/recipes'\nbutton()")

    expect(app.buildInfo.hydrate(recipeInfo('red'), { name: '@z/root' })).toEqual({
      ok: true,
      modules: ['button.tsx'],
    })
    expect(app.buildInfo.hydrate(recipeInfo('green'), { name: '@a/child' })).toEqual({
      ok: true,
      modules: ['button.tsx'],
    })
    expect(app.getLayerCss({ layers: ['recipes'] }).css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer base {
          .button {
            color: red;
          }
          .button {
            color: green;
          }
          .button {
            color: blue;
          }
        }
      }
      "
    `)
  })

  it('hydrate() tree-shakes recipes to the imported modules', () => {
    const app = recipeConsumer()
    const result = app.buildInfo.hydrate(recipeLibBuildInfo(), { name: '@acme/ds', only: ['button.tsx'] })
    expect(result).toEqual({ ok: true, modules: ['button.tsx'] })
    const css = app.getLayerCss({ layers: ['recipes'] }).css
    // button's recipe is present; tabs' slot recipe is tree-shaken out.
    expect(css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer base {
          .button {
            display: inline-flex;
          }
        }
        @layer variants {
          .button--size_sm {
            font-size: 12px;
          }
        }
      }
      "
    `)
  })

  it('hydrate() is a no-op on an incompatible schema version', () => {
    const app = consumer()
    const result = app.buildInfo.hydrate(withUnsupportedSchemaVersion(libBuildInfo()), { name: '@acme/ds' })
    expect(result).toEqual({ ok: false, reason: 'schemaVersion', modules: [] })
    expect(app.getLayerCss({ layers: ['utilities'] }).css).toBe('')
  })

  // --- viewTransition() bags through hydrate ---

  it('hydrate() emits viewTransition bag CSS and tree-shakes unused modules', () => {
    const lib = createProject({})
    lib.parseFileSource(
      'slide.ts',
      `import { viewTransition } from '@panda/css'
       export const slide = viewTransition({
         group: { animationDuration: '0.4s' },
         old: { opacity: 0 },
         new: { opacity: 1 },
       })`,
    )
    lib.parseFileSource(
      'fade.ts',
      `import { viewTransition } from '@panda/css'
       export const fade = viewTransition({
         group: { animationDuration: '200ms' },
       })`,
    )
    const info = lib.buildInfo.create({ panda: '^2.0.0' })

    expect(info.viewTransitions?.length).toBe(2)
    expect(info.modules['slide.ts']?.viewTransitions?.length).toBe(1)
    expect(info.modules['fade.ts']?.viewTransitions?.length).toBe(1)

    const app = createProject({})
    expect(app.buildInfo.hydrate(info, { name: '@acme/ds', only: ['slide.ts'] })).toEqual({
      ok: true,
      modules: ['slide.ts'],
    })

    const utilities = app.getLayerCss({ layers: ['utilities'] }).css
    expect(utilities).toMatchInlineSnapshot(`
      "@layer utilities {
        .vt_kXwuyX {
          view-transition-class: vt_kXwuyX;
        }
        ::view-transition-group(.vt_kXwuyX) {
          animation-duration: 0.4s;
        }
        ::view-transition-old(.vt_kXwuyX) {
          opacity: 0;
        }
        ::view-transition-new(.vt_kXwuyX) {
          opacity: 1;
        }
      }
      "
    `)
    expect(utilities).not.toContain('200ms')
  })
})
