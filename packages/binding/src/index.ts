import { loadNativeBinding } from './load-binary'

export interface CompileInput {
  files?: Array<{ path: string; content: string }>
  config?: Record<string, unknown>
  cwd?: string
  cacheDir?: string
}

export interface CompileManifest {
  hashes: string[]
  tokens: string[]
}

export interface Diagnostic {
  message: string
  severity: 'info' | 'warning' | 'error'
}

export interface CompileOutput {
  css: string
  sourceMap?: string
  manifest: CompileManifest
  diagnostics: Diagnostic[]
}

export interface NativeBinding {
  compile(input?: CompileInput): CompileOutput
}

const fallback: NativeBinding = {
  compile() {
    return {
      css: '',
      manifest: { hashes: [], tokens: [] },
      diagnostics: [],
    }
  },
}

const binding = loadNativeBinding() ?? fallback

export function compile(input: CompileInput = {}): CompileOutput {
  return binding.compile(input)
}

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}
