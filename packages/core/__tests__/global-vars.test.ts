import { createGeneratorContext } from '@pandacss/fixture'
import type { GlobalVarsDefinition } from '@pandacss/types'
import { describe, expect, test } from 'vitest'

function globalVars(vars?: GlobalVarsDefinition) {
  const ctx = createGeneratorContext({
    globalVars: vars,
  })
  const sheet = ctx.createSheet()
  sheet.processGlobalCss({})
  return sheet.toCss()
}

describe('Global vars', () => {
  test('it works', () => {
    const css = globalVars({
      '--random-color': 'red',
      '--button-color': {
        syntax: '<color>',
        inherits: false,
        initialValue: 'blue',
      },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer base {
        :where(html) {
          --random-color: red;
      }

        @property --button-color {
          syntax: '<color>';

          inherits: false;

          initial-value: blue;
        }
      }"
    `)
  })
})
