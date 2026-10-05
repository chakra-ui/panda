import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readCliVersion } from '../src/version'

const testDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(testDir, '../../..')
const bin = resolve(root, 'packages/cli/bin.js')
const version = readCliVersion()
const describeBinSmoke =
  process.env.PANDA_CLI_BIN_SMOKE === '1' || process.env.npm_lifecycle_event === 'test:bin' ? describe : describe.skip

function eagerImports(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return seen
  seen.add(file)
  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(/^import[^'"]*["']([^'"]+)["']/gm)) {
    if (specifier!.startsWith('.')) eagerImports(resolve(dirname(file), specifier!), seen)
    else seen.add(specifier!)
  }
  return seen
}

function runBin(args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      CI: '1',
      NODE_ENV: undefined,
      NO_COLOR: '1',
      FORCE_COLOR: undefined,
      ...env,
    },
  })

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.status,
  }
}

describeBinSmoke('cli bin smoke', () => {
  it('runs the built binary', () => {
    expect(runBin(['--version'])).toMatchObject({ exitCode: 0, stdout: `${version}\n`, stderr: '' })

    const help = runBin(['--help'])
    expect(help.exitCode).toBe(0)
    expect(help.stdout).toContain('init|dev|build|check|doctor|debug|buildinfo|lib|analyze|codegen|cssgen')
    expect(help.stdout).not.toContain('`info`')

    const initHelp = runBin(['init', '--help'])
    expect(initHelp.exitCode).toBe(0)
    expect(initHelp.stdout).toContain('--skip-presets')
    expect(initHelp.stdout).not.toContain('--no-input')
  })

  it('writes a complete PANDA_TRACE file', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'panda-trace-'))
    const traceFile = resolve(dir, 'trace.json')

    try {
      const result = runBin(['debug', '--dry', '--onlyConfig', '--cwd', 'sandbox/vite-ts'], {
        PANDA_TRACE: 'trace',
        PANDA_TRACE_OUTPUT: 'chrome-json',
        PANDA_TRACE_FILE: traceFile,
      })
      expect(result.exitCode).toBe(0)

      const events = JSON.parse(readFileSync(traceFile, 'utf8')) as Array<{ name: string }>
      expect(events.map((event) => event.name)).toContain('compile_config')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('loads init and debug dependencies only for those commands', () => {
    const loaded = eagerImports(resolve(root, 'packages/cli/dist/cli-main.js'))
    expect([...loaded].filter((id) => ['string-width', 'fflate', '@clack/prompts'].includes(id))).toEqual([])
  })
})
