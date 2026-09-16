import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

/** `CONFIG` plus a token, so the design system spec has something to emit. */
export const CONFIG_WITH_TOKENS = CONFIG.replace(
  '  outdir:',
  "  theme: { tokens: { colors: { brand: { value: '#EA8433' } } } },\n  outdir:",
)

export const EMPTY_CONFIG = CONFIG.replace("include: ['**/*.tsx']", "include: ['missing/**/*.tsx']")

export function createFixture(config = CONFIG, options: { config?: boolean; source?: boolean } = {}) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-cli-')))
  if (options.config !== false) {
    writeFileSync(join(dir, 'panda.config.ts'), config)
  }
  if (options.source !== false) {
    writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")
  }
  return dir
}

export function cleanupFixture(dir: string | undefined) {
  if (dir) rmSync(dir, { recursive: true, force: true })
}

/** Symlink the workspace `@pandacss/dev` package (plus the bundled presets it depends on) into a temp fixture for init/codegen tests. */
export function linkWorkspaceDevPackage(dir: string) {
  const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const scopeDir = join(dir, 'node_modules', '@pandacss')
  mkdirSync(scopeDir, { recursive: true })
  for (const name of ['dev', 'preset-base', 'preset-panda']) {
    symlinkSync(join(packagesRoot, name), join(scopeDir, name), 'dir')
  }
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
