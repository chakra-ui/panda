import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const CONFIG = `export default {
  outdir: 'styled-system',
  include: ['**/*.tsx'],
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
}
`

export const EMPTY_CONFIG = CONFIG.replace("include: ['**/*.tsx']", "include: ['missing/**/*.tsx']")

export function createFixture(config = CONFIG) {
  const dir = mkdtempSync(join(tmpdir(), 'panda-cli-v2-'))
  writeFileSync(join(dir, 'panda.config.ts'), config)
  writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")
  return dir
}

export function cleanupFixture(dir: string | undefined) {
  if (dir) rmSync(dir, { recursive: true, force: true })
}

export function writeSyntaxError(dir: string) {
  writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css({ color: ")
}

export function writeWarningSource(dir: string) {
  writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css(getStyles())")
}

export function normalizeOutput(output: string, dir: string) {
  return output.replaceAll(dir, '<cwd>')
}
