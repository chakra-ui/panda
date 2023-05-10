import { createCss } from '@pandacss/shared'
import { describe, expect, test } from 'vitest'
import { AtomicRule, type ProcessOptions } from '../src/atomic-rule'
import { createContext } from './fixture'

function backend(obj: ProcessOptions['styles']) {
  const ruleset = new AtomicRule(createContext({ prefix: 'tw', hash: true }))
  ruleset.process({ styles: obj })
  return ruleset.toCss()
}

const frontend = createCss(createContext({ prefix: 'tw', hash: true }))

describe('atomic-rule / prefix', () => {
  test('should product consistent hash', () => {
    expect(backend({ color: 'red' })).toMatchInlineSnapshot(`
      "@layer utilities {
          .tw-eIKWVi {
              color: red
          }
      }"
    `)
    expect(frontend({ color: 'red' })).toMatchInlineSnapshot('"tw-eIKWVi"')

    expect(backend({ color: { sm: 'red' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .tw-geqOyW {
              @media screen and (min-width: 640px) {
                  color: red
              }
          }
      }"
    `)
    expect(frontend({ color: { sm: 'red' } })).toMatchInlineSnapshot('"tw-geqOyW"')
  })
})
