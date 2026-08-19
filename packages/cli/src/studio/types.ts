export interface StudioToken {
  category: string
  path: string
  name: string
  value: string
  conditions?: Record<string, string>
  deprecated?: boolean | string
}

export interface StudioRuntime {
  getTokenJson: (opts?: { category?: string; query?: string }) => StudioToken[]
  getTokenHtml: (opts?: { tokens?: StudioToken[]; category?: string; query?: string }) => string
  getTokenCss: (css?: string) => string
}

export interface StudioFile {
  path: string
  code: string
}
