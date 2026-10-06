import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import { usage } from '../fixtures/hash/usage'

let selectors: Set<string>

beforeAll(() => {
  const out = join(mkdtempSync(join(tmpdir(), 'panda-hash-')), 'out.css')
  execFileSync('pnpm', ['panda', 'cssgen', '--config', 'panda.hash.config.ts', '-o', out], { stdio: 'ignore' })
  const css = readFileSync(out, 'utf8')
  selectors = new Set([...css.matchAll(/\.([\w-]+)/g)].map((m) => m[1]))
})

const classesOf = (value: string | Record<string, string>) =>
  (typeof value === 'string' ? [value] : Object.values(value)).flatMap((v) => v.split(' ')).filter(Boolean)

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

  test.each(Object.keys(usage))('%s classes exist in the emitted CSS', (key) => {
    const classes = classesOf(usage[key as keyof typeof usage])
    expect(classes.length).toBeGreaterThan(0)
    expect(classes.filter((c) => !selectors.has(c))).toEqual([])
  })
})
