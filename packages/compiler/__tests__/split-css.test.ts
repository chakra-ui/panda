import { describe, expect, it } from 'vitest'
import { createProject } from './test-utils'

describe('compiler.splitCss()', () => {
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
    expect(compiler.splitCss().map((file) => file.path)).toMatchInlineSnapshot(`
      [
        "styles.css",
        "styles/global.css",
        "styles/tokens.css",
        "styles/utilities.css",
        "styles/recipes/button.css",
        "styles/recipes.css",
      ]
    `)
    expect(compiler.splitCss().find((file) => file.path === 'styles/recipes/button.css')?.code).toMatchInlineSnapshot(`
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
    expect(compiler.splitCss().find((file) => file.path === 'styles.css')?.code).toMatchInlineSnapshot(`
      "@layer reset, base, tokens,
             recipes,
             utilities;
      @import './styles/global.css';
      @import './styles/tokens.css';
      @import './styles/utilities.css';
      @import './styles/recipes.css';
      "
    `)
  })
})
