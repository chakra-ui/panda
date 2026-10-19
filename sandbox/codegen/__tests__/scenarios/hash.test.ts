// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'
import { usage } from '../fixtures/hash/usage'

const root = fileURLToPath(new URL('../..', import.meta.url))

let selectors: Set<string>

beforeAll(() => {
  const out = 'styled-system-hash/styles.css'
  execFileSync('pnpm', ['panda', 'cssgen', '--config', 'panda.hash.config.ts', '-o', out], {
    cwd: root,
    stdio: 'ignore',
  })
  selectors = new Set([...readFileSync(join(root, out), 'utf8').matchAll(/\.([\w-]+)/g)].map((m) => m[1]))
})

const missingFromCss = (value: string | Record<string, string>) => {
  const classes = (typeof value === 'string' ? [value] : Object.values(value)).flatMap((v) => v.split(' '))
  return classes.filter((c) => c && !selectors.has(c))
}

describe('hash: true', () => {
  test('runtime class names', () => {
    expect(usage).toMatchInlineSnapshot(`
      {
        "css": "AxhTk EMgTP jXTqpk",
        "cva": "fPSBzf pvuga",
        "recipeArrayCompound": "ervFBh kSjZJm dMNzRw fqTJZc",
        "recipeBase": "ervFBh",
        "recipeCompound": "ervFBh kSjZJm eynXpK lgnzcJ",
        "recipeVariant": "ervFBh iMKDKL",
        "slotRecipe": {
          "icon": "kkJieb iMuywI",
          "root": "cMVWsu kMgUKh",
        },
        "sva": {
          "label": "hGHvhs fhXfcx",
          "root": "cYdhWw",
        },
      }
    `)
  })

  test('css() classes exist in the emitted CSS', () => {
    expect(missingFromCss(usage.css)).toEqual([])
  })

  test('cva() classes exist in the emitted CSS', () => {
    expect(missingFromCss(usage.cva)).toEqual([])
  })

  test('sva() classes exist in the emitted CSS', () => {
    expect(missingFromCss(usage.sva)).toEqual([])
  })

  test('config recipe base classes exist in the emitted CSS', () => {
    expect(missingFromCss(usage.recipeBase)).toEqual([])
  })

  test('config recipe variant classes exist in the emitted CSS', () => {
    expect(missingFromCss(usage.recipeVariant)).toEqual([])
  })

  test('config recipe compound variant classes exist in the emitted CSS', () => {
    expect(missingFromCss(usage.recipeCompound)).toEqual([])
  })

  test('config recipe array compound variant classes exist in the emitted CSS', () => {
    expect(missingFromCss(usage.recipeArrayCompound)).toEqual([])
  })

  test('config slot recipe classes exist in the emitted CSS', () => {
    expect(missingFromCss(usage.slotRecipe)).toEqual([])
  })
})
