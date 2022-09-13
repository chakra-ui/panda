import type { PluginResult } from '@css-panda/types'

export type PluginContext = {
  import: { module: string; name: string; filename?: string }
  onData?: (result: PluginResult) => void
  onDynamicData?: (name: string, result: PluginResult) => void
}

export type ImportResult = {
  identifer: string
  alias: string
}

export type Collector = {
  css: Set<PluginResult>
  sx: Set<PluginResult>
  jsx: Set<PluginResult>
  globalStyle: Set<PluginResult>
  fontFace: Set<PluginResult>
  cssMap: Set<PluginResult>
  recipe: Map<string, Set<PluginResult>>
  pattern: Map<string, Set<PluginResult>>
}
