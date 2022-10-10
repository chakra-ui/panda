import type { PluginResult } from '@css-panda/types'

export type PluginContext = {
  import: { module: string; name: string | string[]; filename?: string }
  onData?: (result: PluginResult) => void
  onDynamicData?: (name: string, result: PluginResult) => void
}

export type ImportResult = {
  identifer: string
  alias: string
}
