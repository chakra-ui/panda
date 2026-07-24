import { spawnSync } from 'node:child_process'
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

function runBin(args: string[]) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      CI: '1',
      NODE_ENV: undefined,
      NO_COLOR: '1',
      FORCE_COLOR: undefined,
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
    expect(help.stdout).toContain('init|dev|build|check|doctor|debug|buildinfo|lib|analyze|codegen|cssgen|studio')
    expect(help.stdout).not.toContain('`info`')

    const initHelp = runBin(['init', '--help'])
    expect(initHelp.exitCode).toBe(0)
    expect(initHelp.stdout).toContain('--skip-presets')
    expect(initHelp.stdout).not.toContain('--no-input')
  })
})
