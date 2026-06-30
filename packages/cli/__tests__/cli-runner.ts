import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
export const repoRoot = join(here, '..', '..', '..')
const cliMain = join(repoRoot, 'packages/cli/src/cli-main.ts')

interface RunCliOptions {
  cwd?: string
}

export interface RunCliResult {
  stdout: string
  stderr: string
  exitCode: number | null
}

export function runCli(args: string[], options: RunCliOptions = {}): RunCliResult {
  const result = spawnSync(process.execPath, ['--conditions=source', '--import', 'tsx', cliMain, ...args], {
    cwd: options.cwd ?? repoRoot,
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
