/**
 * Emits the utility reference straight from `@pandacss/preset-base`, so the
 * tables in `content/docs/reference/*` cannot drift from the utilities Panda
 * actually ships.
 *
 * Run: pnpm generate:reference
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import preset from '@pandacss/preset-base'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const outFile = path.join(dirname, '../src/generated/utilities.json')

export interface UtilityEntry {
  property: string
  shorthand?: string
  className?: string
  values?: string
  group?: string
}

function describeValues(values: unknown): string | undefined {
  if (values == null) return undefined
  if (typeof values === 'string') return values
  if (Array.isArray(values)) return values.join(' | ')

  // `values` can be `(theme) => ({...})`. Probe it to recover which token
  // category it reads, plus any literal keys it adds on top.
  if (typeof values === 'function') {
    const categories: string[] = []
    try {
      const result = (values as (theme: (c: string) => unknown) => unknown)(
        category => {
          categories.push(category)
          return {}
        }
      )
      const extras =
        result && typeof result === 'object'
          ? Object.keys(result as Record<string, unknown>)
          : []
      const parts = [...new Set(categories)]
      if (extras.length) parts.push(...extras)
      return parts.length ? parts.join(' | ') : 'derived from theme'
    } catch {
      return 'derived from theme'
    }
  }

  if (typeof values === 'object') {
    const keys = Object.keys(values as Record<string, unknown>)
    return keys.length ? keys.join(' | ') : undefined
  }
  return undefined
}

const utilities = (preset.utilities ?? {}) as Record<
  string,
  Record<string, unknown> | undefined
>

const byGroup = new Map<string, UtilityEntry[]>()

for (const [property, config] of Object.entries(utilities)) {
  if (!config) continue
  const group = (config.group as string) ?? 'Other'
  const shorthand = config.shorthand
  const entry: UtilityEntry = {
    property,
    shorthand: Array.isArray(shorthand)
      ? shorthand.join(', ')
      : (shorthand as string | undefined),
    className: config.className as string | undefined,
    values: describeValues(config.values),
    group
  }
  const list = byGroup.get(group) ?? []
  list.push(entry)
  byGroup.set(group, list)
}

const groups = [...byGroup.entries()]
  .map(([group, entries]) => ({
    group,
    entries: entries.sort((a, b) => a.property.localeCompare(b.property))
  }))
  .sort((a, b) => a.group.localeCompare(b.group))

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, `${JSON.stringify({ groups }, null, 2)}\n`)

const total = groups.reduce((sum, g) => sum + g.entries.length, 0)
console.log(
  `Generated ${total} utilities across ${groups.length} groups -> ${path.relative(process.cwd(), outFile)}`
)
