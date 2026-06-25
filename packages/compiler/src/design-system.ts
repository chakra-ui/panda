import { type BuildInfo, type Compiler } from '@pandacss/compiler-shared'
import type { LoadConfigResult } from '@pandacss/config'
import { readFileSync } from 'node:fs'

type ResolvedDesignSystem = NonNullable<LoadConfigResult['metadata']>['designSystem']

export function hydrateDesignSystem(compiler: Compiler, ds: ResolvedDesignSystem): void {
  if (!ds) return
  let buildInfo: BuildInfo
  try {
    buildInfo = JSON.parse(readFileSync(ds.buildInfoPath, 'utf8')) as BuildInfo
  } catch {
    console.warn(
      `[panda] designSystem "${ds.name}": could not read build info at ${ds.buildInfoPath}; its components will not be hydrated and their styles may be missing.`,
    )
    return
  }
  compiler.buildInfo.hydrate(buildInfo, { name: ds.name })
}
