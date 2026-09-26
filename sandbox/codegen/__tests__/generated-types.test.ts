// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

function declaredTypes(path: string) {
  const names: string[] = []
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^export (?:type|interface) ([A-Za-z0-9_]+)/.exec(line)
    if (match) names.push(match[1])
  }
  return names
}

// TypeScript binds the first of two same-named declarations and only reports the clash under
// `skipLibCheck: false`, so a duplicate ships as a silently wrong type. `types/index.d.ts`
// re-exports its siblings, so a name declared in two of them is just as ambiguous.
function expectEachTypeDeclaredOnce(outdir: string) {
  const typesDir = join(root, outdir, 'types')
  const owners = new Map<string, string[]>()

  for (const entry of readdirSync(typesDir).filter((name) => name.endsWith('.d.ts') && name !== 'index.d.ts')) {
    for (const name of declaredTypes(join(typesDir, entry))) {
      owners.set(name, [...(owners.get(name) ?? []), entry])
    }
  }

  const duplicates = [...owners]
    .filter(([, files]) => files.length > 1)
    .map(([name, files]) => `${name} in ${files.join(', ')}`)

  expect(duplicates).toEqual([])
}

describe('generated .d.ts', () => {
  test('the react scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system')
  })

  test('the format-names scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-format-names')
  })

  test('the jsx-minimal scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-jsx-minimal')
  })

  test('the jsx-none scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-jsx-none')
  })

  test('the preact scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-preact')
  })

  test('the qwik scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-qwik')
  })

  test('the solid scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-solid')
  })

  test('the strict scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-strict')
  })

  test('the strict-property-values scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-strict-property-values')
  })

  test('the strict-tokens scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-strict-tokens')
  })

  test('the vue scenario declares each type once', () => {
    expectEachTypeDeclaredOnce('styled-system-vue')
  })
})
