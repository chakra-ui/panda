import { loadNativeBinding } from './load-binary'

// --- compile (placeholder) ---

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

export interface CompileDiagnostic {
  message: string
  severity: 'info' | 'warning' | 'error'
  span?: Span
}

export interface CompileOutput {
  css: string
  sourceMap?: string
  manifest: CompileManifest
  diagnostics: CompileDiagnostic[]
}

// --- scanImports ---

export interface Span {
  start: number
  end: number
}

export type ImportSpecifierKind = 'named' | 'default' | 'namespace'

export interface ImportSpecifier {
  kind: ImportSpecifierKind
  imported: string
  local: string
  typeOnly: boolean
  span: Span
}

export type ImportKind = 'sideEffect' | 'value'

export interface ImportRecord {
  module: string
  kind: ImportKind
  typeOnly: boolean
  specifiers: ImportSpecifier[]
  span: Span
}

export interface ScanDiagnostic {
  message: string
  severity: 'error' | 'warning'
  span?: Span
}

export interface ImportScanResult {
  imports: ImportRecord[]
  diagnostics: ScanDiagnostic[]
}

export interface NativeBinding {
  compile(input?: CompileInput): CompileOutput
  scanImports(source: string, path: string): ImportScanResult
}

const fallback: NativeBinding = {
  compile() {
    return {
      css: '',
      manifest: { hashes: [], tokens: [] },
      diagnostics: [],
    }
  },
  scanImports() {
    return { imports: [], diagnostics: [] }
  },
}

const binding = loadNativeBinding() ?? fallback

export function compile(input: CompileInput = {}): CompileOutput {
  return binding.compile(input)
}

export function scanImports(source: string, path: string): ImportScanResult {
  return binding.scanImports(source, path)
}

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}
