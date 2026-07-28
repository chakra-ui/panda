// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

const outdirs = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('styled-system'))
  .map((entry) => entry.name)

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
describe('generated .d.ts', () => {
  test.each(outdirs)('%s declares each type once', (outdir) => {
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
  })
})
