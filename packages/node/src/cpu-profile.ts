import { logger } from '@pandacss/logger'
import fs from 'fs'
import path from 'path'

export const startProfiling = async (cwd: string, prefix: string) => {
  const inspector = await import('node:inspector').then((r) => r.default)

  const session = new inspector.Session()
  session.connect()

  await new Promise<void>((resolve) => {
    session.post('Profiler.enable', () => {
      session.post('Profiler.start', resolve)
    })
  })

  const stopProfiling = () => {
    session.post('Profiler.stop', (err, { profile }) => {
      if (err) {
        logger.error('cpu-prof', err)
        return
      }
      if (!profile) return

      const date = new Date()
      const timestamp = date.toISOString().replace(/[-:.]/g, '')
      const title = `panda-${prefix}-${timestamp}`

      const outfile = path.join(cwd, `${title}.cpuprofile`)
      fs.writeFileSync(outfile, JSON.stringify(profile))
      logger.info('cpu-prof', outfile)
    })
  }

  return stopProfiling
}
