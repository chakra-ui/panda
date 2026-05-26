import { describe, expect, test } from 'vitest'
import { extractJsx, matchImports, scanImports, type Matchers } from '../src'

const matchers: Matchers = {
  css: { modules: ['@panda/css'], names: ['css', 'cva', 'sva'] },
  recipe: { modules: ['@panda/recipes'] },
  pattern: { modules: ['@panda/patterns'] },
  jsx: { modules: ['@panda/jsx'], names: ['styled', 'Box', 'Stack', 'Grid'] },
  tokens: { modules: ['@panda/tokens'], names: ['token'] },
}

function pipeline(source: string) {
  const scan = scanImports(source, 'fixture.tsx')
  const matched = matchImports(scan, matchers)
  return extractJsx(source, 'fixture.tsx', matched, matchers)
}

describe('extractJsx', () => {
  test('styled factory member: <styled.div color="red" />', () => {
    const source = "import { styled } from '@panda/jsx';\n<styled.div color='red' fontSize='lg' />"
    expect(pipeline(source).jsx).toMatchInlineSnapshot(`
      [
        {
          "category": "jsx",
          "name": "styled.div",
          "alias": "styled",
          "data": {
            "color": "red",
            "fontSize": "lg",
          },
          "span": {
            "start": 37,
            "end": 77,
          },
        },
      ]
    `)
  })

  test('named pattern component: <Box>', () => {
    const source = "import { Box } from '@panda/jsx';\n<Box color='red' />"
    expect(pipeline(source).jsx).toMatchInlineSnapshot(`
      [
        {
          "category": "jsx",
          "name": "Box",
          "alias": "Box",
          "data": {
            "color": "red",
          },
          "span": {
            "start": 34,
            "end": 53,
          },
        },
      ]
    `)
  })

  test('namespace chain: <JSX.styled.div /> and <JSX.Stack />', () => {
    // Wrapped in fragment because adjacent self-closing JSX confuses ASI.
    const source = [
      "import * as JSX from '@panda/jsx'",
      '<>',
      "  <JSX.styled.div color='red' />",
      "  <JSX.Stack color='blue' />",
      '</>',
    ].join('\n')
    expect(pipeline(source).jsx).toMatchInlineSnapshot(`
      [
        {
          "category": "jsx",
          "name": "styled.div",
          "alias": "JSX",
          "data": {
            "color": "red",
          },
          "span": {
            "start": 39,
            "end": 69,
          },
        },
        {
          "category": "jsx",
          "name": "Stack",
          "alias": "JSX",
          "data": {
            "color": "blue",
          },
          "span": {
            "start": 72,
            "end": 98,
          },
        },
      ]
    `)
  })

  test('lowercase HTML tags are ignored', () => {
    const source = "import { Box } from '@panda/jsx';\n<><div color='red' /><Box color='blue' /></>"
    expect(pipeline(source).jsx.map((j) => j.name)).toMatchInlineSnapshot(`
      [
        "Box",
      ]
    `)
  })

  test('boolean shorthand + literal object spread merge', () => {
    const source = "import { Box } from '@panda/jsx';\n<Box rounded {...{ color: 'red' }} fontSize='lg' />"
    expect(pipeline(source).jsx[0].data).toMatchInlineSnapshot(`
      {
        "rounded": true,
        "color": "red",
        "fontSize": "lg",
      }
    `)
  })

  test('non-literal attribute values are skipped', () => {
    const source = "import { Box } from '@panda/jsx';\n<Box color={dynamic} fontSize='lg' />"
    expect(pipeline(source).jsx[0].data).toMatchInlineSnapshot(`
      {
        "fontSize": "lg",
      }
    `)
  })
})
