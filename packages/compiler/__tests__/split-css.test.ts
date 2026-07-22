import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
      @layer recipes.base, recipes.slots, recipes.variants, recipes.compound_variants;
      @layer recipes.slots.base, recipes.slots.variants, recipes.slots.compound_variants;
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
})
