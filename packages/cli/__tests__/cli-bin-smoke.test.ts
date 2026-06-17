import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(testDir, '../../..')
const bin = resolve(root, 'packages/cli/bin.js')
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
    expect(runBin(['--version'])).toMatchObject({ exitCode: 0, stdout: '2.0.0-beta.0\n', stderr: '' })

    const help = runBin(['--help'])
    expect(help.exitCode).toBe(0)
    expect(help.stdout).toContain('init|dev|build|check|info|doctor|debug|buildinfo|codegen|cssgen')
  })
})
