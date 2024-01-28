import type { LoggerInterface } from '@pandacss/types'
import fs from 'fs'
import path from 'path'

export const startProfiling = async (cwd: string, prefix: string, logger: LoggerInterface) => {
  const v8Profiler = (await import('v8-profiler-next')).default
  const date = new Date()
  const timestamp = date.toISOString().replace(/[-:.]/g, '')
  const title = `panda-${prefix}-${timestamp}`

  // set generateType 1 to generate new format for cpuprofile
  // to be compatible with cpuprofile parsing in vscode.
  v8Profiler.setGenerateType(1)
  v8Profiler.startProfiling(title, true)

  const stopProfiling = () => {
    const profile = v8Profiler.stopProfiling(title)
    profile.export(function (error, result) {
      if (error) {
        console.error(error)
        return
      }
      if (!result) return

      const outfile = path.join(cwd, `${title}.cpuprofile`)
      fs.writeFileSync(outfile, result)
      logger.info('cpu-prof', outfile)
      profile.delete()
    })
  }

  return stopProfiling
}
