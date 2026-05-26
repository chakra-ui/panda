import { describe, expect, test } from 'vitest'
import { createProject } from './test-utils'

const compiler = createProject()

function pipeline(source: string) {
  return compiler.extract(source, 'fixture.tsx')
}

describe('compiler.extract → jsx', () => {
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

  test('namespace chain: <JSX.styled.div /> (config-unknown <JSX.Stack /> filtered)', () => {
    // Wrapped in fragment because adjacent self-closing JSX confuses ASI.
    // `<JSX.Stack />` is not a configured component, so config-aware
    // extraction drops it (the raw namespace-chain mechanics live in the
    // Rust `jsx.rs` parity tests).
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

  test('literal object spread merges into props (config-unknown boolean prop filtered)', () => {
    // The spread `{ color: 'red' }` merges in; `rounded` is not a known
    // style prop in this config so config-aware extraction drops it (raw
    // boolean-shorthand handling is covered by the Rust `jsx.rs` tests).
    const source = "import { Box } from '@panda/jsx';\n<Box rounded {...{ color: 'red' }} fontSize='lg' />"
    expect(pipeline(source).jsx[0].data).toMatchInlineSnapshot(`
      {
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
