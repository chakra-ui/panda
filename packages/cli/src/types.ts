import type { Config } from '@pandacss/types'

export interface InitCommandFlags
  extends Pick<Config, 'jsxFramework' | 'syntax' | 'cwd' | 'poll' | 'watch' | 'gitignore' | 'outExtension'> {
  force?: boolean
  postcss?: boolean
  silent?: boolean
  interactive?: boolean
  config?: string
}

export interface CssGenCommandFlags {
  silent?: boolean
  clean?: boolean
  outfile?: string
  minimal?: boolean
  watch?: boolean
  poll?: boolean
  cwd?: string
  config?: string
  minify?: boolean
}

export interface StudioCommandFlags extends Pick<Config, 'cwd'> {
  build?: boolean
  preview?: boolean
  config?: string
  outdir?: string
  port?: string
  host?: boolean
}

export interface AnalyzeCommandFlags {
  silent?: boolean
  json?: string
  cwd?: string
  config?: string
}

export interface DebugCommandFlags {
  silent?: boolean
  dry?: boolean
  outdir?: string
  cwd?: string
  config?: string
  onlyConfig?: boolean
}

export interface ShipCommandFlags {
  silent?: boolean
  minify?: boolean
  outfile?: string
  cwd?: string
  config?: string
  watch?: boolean
  poll?: boolean
}

export interface CodegenCommandFlags extends Pick<Config, 'cwd' | 'poll' | 'watch'> {
  clean?: boolean
  silent?: boolean
  config?: string
}

export interface MainCommandFlags extends Pick<Config, 'cwd' | 'poll' | 'watch'> {
  outdir?: string
  minify?: boolean
  config?: string
  cwd: string
  preflight?: boolean
  silent?: boolean
  exclude?: string[]
  hash?: boolean
  emitTokensOnly?: boolean
}
