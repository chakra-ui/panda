import { createStudioRuntime } from './runtime'
import type { StudioFile, StudioToken } from './types'

export function studioRuntimeModule(tokens: StudioToken[]): string {
  return `const createStudioRuntime = ${createStudioRuntime.toString()}
const runtime = createStudioRuntime(${JSON.stringify(tokens)})
export const getTokenJson = runtime.getTokenJson
export const getTokenHtml = runtime.getTokenHtml
export const getTokenCss = runtime.getTokenCss
`
}

export function studioArtifactFiles(tokens: StudioToken[]): StudioFile[] {
  const dts = `export interface StudioToken {
  category: string
  path: string
  name: string
  value: string
  conditions?: Record<string, string>
  deprecated?: boolean | string
}
export declare function getTokenJson(opts?: { category?: string; query?: string; sort?: 'value' | 'name' }): StudioToken[]
export declare function getTokenHtml(opts?: { tokens?: StudioToken[]; category?: string; query?: string; sort?: 'value' | 'name' }): string
export declare function getTokenCss(css?: string): string
`
  return [
    { path: 'studio/index.mjs', code: studioRuntimeModule(tokens) },
    { path: 'studio/index.d.ts', code: dts },
  ]
}
