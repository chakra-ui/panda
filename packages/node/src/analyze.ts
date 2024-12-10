import { Reporter } from '@pandacss/reporter'
import type { AnalysisOptions } from '@pandacss/types'
import type { PandaContext } from './create-context'

export function analyze(ctx: PandaContext, options: AnalysisOptions = {}) {
  const reporter = new Reporter(ctx, {
    project: ctx.project,
    getRelativePath: ctx.runtime.path.relative,
    getFiles: ctx.getFiles,
    ...options,
  })

  reporter.init()

  return {
    getRecipeReport: () => reporter.getRecipeReport(),
    getTokenReport: () => reporter.getTokenReport(),
    writeReport: (filePath: string) => {
      const dirname = ctx.runtime.path.dirname(filePath)
      ctx.runtime.fs.ensureDirSync(dirname)
      const str = JSON.stringify(reporter.report, replacer, 2)
      return ctx.runtime.fs.writeFile(filePath, str)
    },
  }
}

function replacer(_: string, value: any) {
  if (value instanceof Set) return Array.from(value)
  if (value instanceof Map) return Object.fromEntries(value)
  return value
}
