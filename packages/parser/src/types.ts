import { PluginResult } from '@css-panda/types'

export type PluginContext = {
  import: { module: string; name: string }
  onData: (result: PluginResult) => void
}

export type ImportResult = {
  identifer: string
  alias: string
}

export type Collector = {
  css: Set<PluginResult>
  globalStyle: Set<PluginResult>
  fontFace: Set<PluginResult>
}
