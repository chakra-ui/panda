import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = '.svelte-kit/output/client/_app/immutable'
const files = readdirSync(root, { recursive: true }).filter((f) => f.endsWith('.js'))
const call = /\b(css|cva|sva)(\$\d+)?\(\{/g

let total = 0
for (const file of files) {
  const hits = readFileSync(join(root, file), 'utf8').match(call) ?? []
  if (!hits.length) continue
  total += hits.length
  console.log(`${file}: ${hits.length} untransformed call(s) — ${[...new Set(hits)].join(' ')}`)
}

console.log(total ? `\n✗ ${total} style call(s) shipped to the client` : '✓ no style calls shipped to the client')
process.exitCode = total ? 1 : 0
