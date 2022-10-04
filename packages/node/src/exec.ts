import { logger } from '@css-panda/logger'
import { spawnSync } from 'child_process'
import getPackageManager from 'preferred-pm'

export async function execCommand(cmd: string, cwd: string) {
  const manager = await getPackageManager(cwd)
  const pm = manager?.name ?? 'npm'
  const args = cmd.split(' ')

  if (pm === 'npm') {
    args.unshift('run')
  }

  const check = spawnSync(pm, args, { cwd, stdio: 'pipe' })

  if (check.status !== 0) {
    logger.error(check.stderr.toString())
  }
}
