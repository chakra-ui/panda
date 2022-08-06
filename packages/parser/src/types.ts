type DataType = 'object' | 'named-object'

export type PluginContext = {
  import: { module: string; name: string }
  onData: (result: { type: DataType; name?: string; data: Record<string, any> }) => void
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
