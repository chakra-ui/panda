import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { bundle } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import { createProject } from './test-utils'

describe('compiler.getSplitCss()', () => {
  it('returns per-layer + per-recipe files plus index files', () => {
    const compiler = createProject({
      theme: {
        tokens: { colors: { red: { value: '#f00' } } },
        recipes: {
          button: {
            className: 'button',
            base: { display: 'inline-flex' },
            variants: { size: { sm: { padding: '8px' } } },
          },
        },
      },
      utilities: {
        color: { className: 'c', values: 'colors' },
        display: { className: 'd' },
        padding: { className: 'p' },
      },
    })
    compiler.parseFileSource(
      'app.tsx',
      "import { css } from '@panda/css'\nimport { button } from '@panda/recipes'\ncss({ color: 'red' })\nbutton({ size: 'sm' })",
    )
    expect(compiler.getSplitCss().files.map((file) => file.path)).toMatchInlineSnapshot(`
      [
        "styles.css",
        "styles/layers.css",
        "styles/global.css",
        "styles/tokens.css",
        "styles/utilities.css",
        "styles/recipes/button.css",
        "styles/recipes.css",
      ]
    `)
    expect(compiler.getSplitCss().files.find((file) => file.path === 'styles/recipes/button.css')?.code)
      .toMatchInlineSnapshot(`
      "@layer recipes {
        @layer base {
          .button {
            display: inline-flex;
          }
        }
        @layer variants {
          .button--size_sm {
            padding: 8px;
          }
        }
      }
      "
    `)
    expect(compiler.getSplitCss().files.find((file) => file.path === 'styles.css')?.code).toMatchInlineSnapshot(`
      "@layer reset, base, tokens,
             recipes,
             utilities;
      @import './styles/layers.css';
      @import './styles/global.css';
      @import './styles/tokens.css';
      @import './styles/utilities.css';
      @import './styles/recipes.css';
      "
    `)
  })

  it('returns split diagnostics', () => {
    const compiler = createProject({
      staticCss: { css: [{ properties: { colr: 'red' } }] },
    })

    expect(compiler.getSplitCss().diagnostics.map((diagnostic) => diagnostic.code)).toMatchInlineSnapshot(`
      [
        "static_css_property_unknown",
      ]
    `)
  })

  it('defaults writeSplitCss to the configured outdir', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'panda-split-default-'))
    try {
      const compiler = createProject({ cwd, outdir: 'styled-system' })
      const result = compiler.writeSplitCss({})

      expect({
        root: result.root === join(cwd, 'styled-system'),
        pathsAreContained: result.paths.every((path) => path.startsWith(`${result.root}/`)),
      }).toMatchInlineSnapshot(`
        {
          "root": true,
          "pathsAreContained": true,
        }
      `)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
  it('bundles split styles.css with Lightning CSS and keeps the recipe sub-layer order', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'panda-split-bundle-'))
    try {
      const compiler = createProject({
        cwd,
        outdir: 'styled-system',
        theme: {
          recipes: {
            button: {
              className: 'button',
              base: { color: 'red' },
              variants: { tone: { blue: { color: 'blue' } } },
            },
          },
          slotRecipes: {
            card: {
              className: 'card',
              slots: ['root'],
              base: { root: { color: 'green' } },
            },
          },
        },
        utilities: { color: { className: 'c' } },
      })
      compiler.parseFileSource(
        'app.tsx',
        ["import { button, card } from '@panda/recipes'", "button({ tone: 'blue' })", 'card()'].join('\n'),
      )
      const { root } = compiler.writeSplitCss({})
      const { code } = bundle({ filename: join(root, 'styles.css'), minify: true })

      expect(code.toString().replaceAll('@layer', '\n@layer').trim()).toMatchInlineSnapshot(`
        "@layer reset;
        @layer base{:root{--made-with-panda:"🐼"}}
        @layer tokens;
        @layer recipes{
        @layer base{.button{color:red}}
        @layer slots;
        @layer variants{.button--tone_blue{color:#00f}}
        @layer compound_variants;}
        @layer utilities;
        @layer recipes.slots{
        @layer base{.card__root{color:green}}
        @layer variants,compound_variants;}"
      `)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
