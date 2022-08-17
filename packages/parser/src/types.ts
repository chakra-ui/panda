type DataType = 'object' | 'named-object'

export type PluginResult = {
  type: DataType
  name?: string
  data: Record<string, any>
}

export type PluginContext = {
  import: { module: string; name: string }
  onData: (result: PluginResult) => void
}

export type ImportResult = {
  identifer: string
  alias: string
}

export type Collector = {
  css: Set<any>
  globalStyle: Set<any>
  fontFace: Set<any>
}
