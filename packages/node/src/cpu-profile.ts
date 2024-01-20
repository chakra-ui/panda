import { logger } from '@pandacss/logger'
import fs from 'fs'
import path from 'path'
import v8Profiler from 'v8-profiler-next'

export const startProfiling = (cwd: string, prefix: string) => {
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
