import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The repo's `skills/` stays the source of truth; npm ships a copy under `skills/<name>/SKILL.md`.
const source = fileURLToPath(new URL('../../../skills', import.meta.url))
const target = fileURLToPath(new URL('../skills', import.meta.url))

rmSync(target, { recursive: true, force: true })

for (const name of readdirSync(source)) {
  if (existsSync(join(source, name, 'SKILL.md'))) {
    cpSync(join(source, name), join(target, name), { recursive: true })
  }
}
