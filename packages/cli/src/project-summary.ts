import type { Driver } from '@pandacss/compiler'

export interface ProjectSummary {
  configPath?: string
  sourceCount: number
  watchDirs: string[]
  artifactIds: string[]
  conditionCount: number
  tokenCategoryCount: number
  utilityCount: number
}

export function projectSummary(driver: Driver): ProjectSummary {
  const spec = driver.introspect.spec
  const targets = driver.watchTargets()
  return {
    configPath: driver.configPath,
    sourceCount: targets.sources.length,
    watchDirs: targets.dirs,
    artifactIds: driver
      .artifacts()
      .map((artifact) => artifact.id)
      .sort(),
    conditionCount: driver.introspect.conditions().length,
    tokenCategoryCount: Object.keys(spec.tokens.categories).length,
    utilityCount: Object.keys(spec.utilities.properties).length,
  }
}
