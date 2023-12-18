import { createCss } from '@pandacss/shared'
import { describe, expect, test } from 'vitest'
import { createCssFn, createContext } from './fixture'

const backend = createCssFn({ prefix: 'tw', hash: true })

const frontend = createCss(createContext({ prefix: 'tw', hash: true }))

describe('atomic-rule / prefix', () => {
  test('should product consistent hash', () => {
    expect(backend({ color: 'red' })).toMatchInlineSnapshot(`
      "@layer utilities {
          .tw_eIKWVi {
              color: red
          }
      }"
    `)
    expect(frontend({ color: 'red' })).toMatchInlineSnapshot('"tw_eIKWVi"')

    expect(backend({ color: { sm: 'red' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .tw_geqOyW {
              @media screen and (min-width: 40em) {
                  color: red
              }
          }
      }"
    `)
    expect(frontend({ color: { sm: 'red' } })).toMatchInlineSnapshot('"tw_geqOyW"')
  })
})
