import { createContext } from '@pandacss/fixture'
import type { Config } from '@pandacss/types'
import { expect, test } from 'vitest'
import { generateTokenJs } from '../src/artifacts/js/token'

const tokenJs = (userConfig?: Config) => {
  const generator = createContext(userConfig)
  return generateTokenJs(generator).js
}

test('[dts] should generate package', () => {
  expect(tokenJs()).toMatchInlineSnapshot(`
    "import * as tokens from './tokens-entry.mjs';

    function getTokenVarName(name) {
      return name.replace(/(?:\\.-(\\d+))/g, ".n$1").replace(/\\./g, "_");
    }

    export { tokens }

    export function token(path, fallback) {
      const value = tokens.$[path] ?? tokens[getTokenVarName(path)]
      return value || fallback
    }

    function tokenVar(path, fallback) {
      return token(path)?.var || fallback
    }

    token.var = tokenVar"
  `)
})

test('with formatTokenName', () => {
  expect(
    tokenJs({
      hooks: {
        'tokens:created': ({ configure }) => {
          configure({
            formatTokenName: (path: string[]) => '$' + path.join('-'),
          })
        },
      },
    }),
  ).toMatchInlineSnapshot(`
    "import * as tokens from './tokens-entry.mjs';

    function getTokenVarName(name) {
      return name.replace(/(?:\\.-(\\d+))/g, ".n$1").replace(/\\./g, "_");
    }

    export { tokens }

    export function token(path, fallback) {
      const value = tokens.$[path] ?? tokens[getTokenVarName(path)]
      return value || fallback
    }

    function tokenVar(path, fallback) {
      return token(path)?.var || fallback
    }

    token.var = tokenVar"
  `)
})

test('use raw value when possible for semanticTokens', () => {
  expect(
    generateTokenJs(
      createContext({
        eject: true,
        theme: {
          tokens: {},
          semanticTokens: {
            colors: {
              blue: { value: 'blue' },
              green: {
                value: {
                  base: 'green',
                  _dark: 'white',
                },
              },
              red: {
                value: {
                  base: 'red',
                },
              },
              blueRef: { value: '{colors.blue}' },
              redRef: { value: '{colors.red}' },
            },
          },
        },
      }),
    ),
  ).toMatchInlineSnapshot(`
    {
      "dts": "import type { Token } from './tokens';
    export * as tokens from './tokens-entry.d.ts'

    export declare const token: {
      (path: Token, fallback?: string): string
      var: (path: Token, fallback?: string) => string
    }

    export * from './tokens';",
      "js": "import * as tokens from './tokens-entry.mjs';

    function getTokenVarName(name) {
      return name.replace(/(?:\\.-(\\d+))/g, ".n$1").replace(/\\./g, "_");
    }

    export { tokens }

    export function token(path, fallback) {
      const value = tokens.$[path] ?? tokens[getTokenVarName(path)]
      return value || fallback
    }

    function tokenVar(path, fallback) {
      return token(path)?.var || fallback
    }

    token.var = tokenVar",
    }
  `)
})
