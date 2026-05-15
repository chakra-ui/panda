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
          "alias": "css",
          "category": "css",
          "kind": "named",
          "module": "@panda/css",
          "name": "css",
        },
        {
          "alias": "token",
          "category": "tokens",
          "kind": "named",
          "module": "@panda/tokens",
          "name": "token",
        },
        {
          "alias": "cardStyle",
          "category": "recipe",
          "kind": "named",
          "module": "@panda/recipes",
          "name": "cardStyle",
        },
        {
          "alias": "stack",
          "category": "pattern",
          "kind": "named",
          "module": "@panda/patterns",
          "name": "stack",
        },
        {
          "alias": "styled",
          "category": "jsx",
          "kind": "named",
          "module": "@panda/jsx",
          "name": "styled",
        },
        {
          "alias": "Box",
          "category": "jsx",
          "kind": "named",
          "module": "@panda/jsx",
          "name": "Box",
        },
      ]
    `)
  })

  test('rejects unknown names within a Panda module', () => {
    const scan = scanImports("import { somethingElse } from '@panda/css'\n", 'fixture.tsx')
    expect(matchImports(scan, pandaOrg('@panda'))).toEqual([])
  })

  test('namespace import bypasses the name allowlist', () => {
    const scan = scanImports("import * as p from '@panda/css'\n", 'fixture.tsx')
    const result = matchImports(scan, pandaOrg('@panda'))
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      category: 'css',
      kind: 'namespace',
      name: '*',
      alias: 'p',
    })
  })
})
