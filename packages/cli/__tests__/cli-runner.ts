import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const cliMain = join(root, 'packages/cli/src/cli-main.ts')

interface RunCliOptions {
  cwd?: string
}

export interface RunCliResult {
  stdout: string
  stderr: string
  exitCode: number | null
}

export function runCli(args: string[], options: RunCliOptions = {}): RunCliResult {
  const result = spawnSync(process.execPath, ['--import', 'tsx', cliMain, ...args], {
    cwd: options.cwd ?? root,
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
