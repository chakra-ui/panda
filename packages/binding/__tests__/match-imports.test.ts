import { describe, expect, test } from 'vitest'
import { matchImports, scanImports, type Matchers } from '../src'

function pandaOrg(prefix: string): Matchers {
  return {
    css: { modules: [`${prefix}/css`], names: ['css', 'cva', 'sva'] },
    recipe: { modules: [`${prefix}/recipes`] },
    pattern: { modules: [`${prefix}/patterns`] },
    jsx: { modules: [`${prefix}/jsx`], names: ['styled', 'Box'] },
    tokens: { modules: [`${prefix}/tokens`], names: ['token'] },
  }
}

describe('matchImports', () => {
  test('matches each Panda category from one source', () => {
    const source = [
      "import { css } from '@panda/css'",
      "import { token } from '@panda/tokens'",
      "import { cardStyle } from '@panda/recipes'",
      "import { stack } from '@panda/patterns'",
      "import { styled, Box } from '@panda/jsx'",
      '',
    ].join('\n')
    const scan = scanImports(source, 'fixture.tsx')
    expect(matchImports(scan, pandaOrg('@panda'))).toMatchInlineSnapshot(`
      [
        {
          "category": "css",
          "module": "@panda/css",
          "name": "css",
          "alias": "css",
          "kind": "named",
        },
        {
          "category": "tokens",
          "module": "@panda/tokens",
          "name": "token",
          "alias": "token",
          "kind": "named",
        },
        {
          "category": "recipe",
          "module": "@panda/recipes",
          "name": "cardStyle",
          "alias": "cardStyle",
          "kind": "named",
        },
        {
          "category": "pattern",
          "module": "@panda/patterns",
          "name": "stack",
          "alias": "stack",
          "kind": "named",
        },
        {
          "category": "jsx",
          "module": "@panda/jsx",
          "name": "styled",
          "alias": "styled",
          "kind": "named",
        },
        {
          "category": "jsx",
          "module": "@panda/jsx",
          "name": "Box",
          "alias": "Box",
          "kind": "named",
        },
      ]
    `)
  })

  test('rejects unknown names within a Panda module', () => {
    const scan = scanImports("import { somethingElse } from '@panda/css'\n", 'fixture.tsx')
    expect(matchImports(scan, pandaOrg('@panda'))).toMatchInlineSnapshot('[]')
  })

  test('namespace import bypasses the name allowlist', () => {
    const scan = scanImports("import * as p from '@panda/css'\n", 'fixture.tsx')
    expect(matchImports(scan, pandaOrg('@panda'))).toMatchInlineSnapshot(`
      [
        {
          "category": "css",
          "module": "@panda/css",
          "name": "*",
          "alias": "p",
          "kind": "namespace",
        },
      ]
    `)
  })
})
