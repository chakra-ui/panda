import type { Config } from '@pandacss/types'

export interface InitCommandFlags
  extends Pick<Config, 'jsxFramework' | 'syntax' | 'cwd' | 'poll' | 'watch' | 'gitignore' | 'outExtension' | 'outdir'> {
  force?: boolean
  postcss?: boolean
  silent?: boolean
  interactive?: boolean
  config?: string
  logfile?: string
  codegen?: boolean
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
  lightningcss?: boolean
  polyfill?: boolean
  cpuProf?: boolean
  logfile?: string
}

export interface StudioCommandFlags extends Pick<Config, 'cwd'> {
  build?: boolean
  preview?: boolean
  config?: string
  outdir?: string
  port?: string
  host?: boolean
  base?: string
}

export interface AnalyzeCommandFlags {
  silent?: boolean
  outfile?: string
  cwd?: string
  config?: string
  scope?: 'token' | 'recipe'
}

export interface DebugCommandFlags {
  silent?: boolean
  dry?: boolean
  outdir?: string
  cwd?: string
  config?: string
  onlyConfig?: boolean
  cpuProf?: boolean
  logfile?: string
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
  cpuProf?: boolean
  logfile?: string
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
  lightningcss?: boolean
  polyfill?: boolean
  cpuProf?: boolean
  logfile?: string
}

export interface EmitPackageCommandFlags {
  outdir: string
  silent?: boolean
  cwd: string
  base?: string
}

export interface McpCommandFlags {
  cwd?: string
  config?: string
}
