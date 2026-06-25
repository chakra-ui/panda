import type {
  Atom,
  CompileOutput,
  Compiler,
  DesignSystemManifestInput,
  Diagnostic,
  LayerCssOptions,
  SplitCssOptions,
  WriteArtifactsOptions,
  WriteCssOptions,
  WriteCssResult,
  WriteFilesResult,
  WriteLayerCssOptions,
  WriteSplitCssOptions,
} from '@pandacss/compiler-shared'
import { BuildInfo, DesignSystem } from '@pandacss/compiler-shared'
import type { CompilerConstructor, ExtractorSession, ExtractorSessionConstructor, NativeBinding } from './types'

/** No-op build-info primitives so the fallback compiler still satisfies the
 *  `Compiler.buildInfo` surface; `validate`/`hydrate` always report incompatible. */
const fallbackBuildInfo = new BuildInfo({
  serializeBuildInfo: () => ({
    schemaVersion: -1,
    panda: '',
    configFingerprint: '',
    strings: [],
    atoms: [],
    modules: {},
  }),
  applyBuildInfo: () => false,
  buildInfoSchemaVersion: () => -1,
  configFingerprint: () => '',
})

/** No-op design-system primitives; `validate` always reports incompatible
 *  (`schemaVersion` is `-1`). */
const fallbackDesignSystem = new DesignSystem(
  {
    createDesignSystemManifest: (input: DesignSystemManifestInput) => ({ ...input, schemaVersion: -1 }),
    designSystemManifestSchemaVersion: () => -1,
    resolveDesignSystemChain: () => ({ status: 'ordered', order: [] }),
  },
  fallbackBuildInfo,
)

class FallbackExtractor implements ExtractorSession {
  extract() {
    return { calls: [], jsx: [], diagnostics: [] }
  }
  extractDebug() {
    return { imports: [], matched: [], calls: [], jsx: [], diagnostics: [] }
  }
  matchImports() {
    return []
  }
}

class FallbackCompiler implements Compiler {
  static fromConfig() {
    return new FallbackCompiler()
  }
  serializeBuildInfo() {
    return fallbackBuildInfo.create({ panda: '' })
  }
  applyBuildInfo() {
    return false
  }
  buildInfoSchemaVersion() {
    return -1
  }
  configFingerprint() {
    return ''
  }
  createDesignSystemManifest(input: DesignSystemManifestInput) {
    return { ...input, schemaVersion: -1 }
  }
  designSystemManifestSchemaVersion() {
    return -1
  }
  resolveDesignSystemChain() {
    return { status: 'ordered', order: [] } as const
  }
  config() {
    return {}
  }
  extractFileSource() {
    return { calls: [], jsx: [], diagnostics: [] }
  }
  parseFile(path: string) {
    return { path, cssCalls: 0, cvaCalls: 0, svaCalls: 0, jsxUsages: 0, diagnostics: [] }
  }
  parseFileSource(path: string) {
    return { path, cssCalls: 0, cvaCalls: 0, svaCalls: 0, jsxUsages: 0, diagnostics: [] }
  }
  refreshFile() {
    return false
  }
  refreshFileSource() {
    return false
  }
  removeFile() {
    return false
  }
  clear() {
    /* no-op */
  }
  scan() {
    return []
  }
  realpath(path: string) {
    return path
  }
  resolvePath(path: string, cwd?: string) {
    if (!cwd || path.startsWith('/')) return path
    return `${cwd.replace(/\/$/, '')}/${path}`
  }
  joinPath(parts: string[]) {
    return parts.filter(Boolean).join('/')
  }
  dirname(path: string) {
    const index = path.lastIndexOf('/')
    return index <= 0 ? '' : path.slice(0, index)
  }
  isSourceFile() {
    return false
  }
  parseFiles(_paths: string[]) {
    return []
  }
  layers() {
    return { reset: 'reset', base: 'base', tokens: 'tokens', recipes: 'recipes', utilities: 'utilities' }
  }
  hasLayerDeclaration() {
    return false
  }
  spec() {
    return {
      conditions: { keys: [], breakpoints: [], containers: [] },
      tokens: { categories: {}, colorPalettes: [], values: {}, deprecated: {} },
      utilities: { properties: {}, shorthands: {}, deprecated: {} },
      patterns: {},
      recipes: {},
      slotRecipes: {},
      propertyOrder: [],
    }
  }
  sources() {
    return []
  }
  inspectFileSource() {
    return { usages: [], diagnostics: [], calls: [], jsx: [], tokenRefs: [], componentEntries: [], styleEntries: [] }
  }
  resolveUtilityValue() {
    return null
  }
  suggestTokens() {
    return []
  }
  writeArtifacts(_options: WriteArtifactsOptions) {
    return []
  }
  writeCss(options: WriteCssOptions) {
    return emptyWriteCssResult(options.outfile)
  }
  writeLayerCss(options: WriteLayerCssOptions) {
    return emptyWriteCssResult(options.outfile)
  }
  writeSplitCss(options: WriteSplitCssOptions) {
    return emptyWriteFilesResult(options.outdir ?? '')
  }
  isEmpty() {
    return true
  }
  atoms() {
    return [] as Atom[]
  }
  recipes() {
    return []
  }
  slotRecipes() {
    return []
  }
  encodedRecipes() {
    return { base: [], variants: [], atomic: [] }
  }
  staticPatternAtoms() {
    return { atoms: [], diagnostics: [] }
  }
  getFile() {
    return null
  }
  fileManifest() {
    return []
  }
  summary() {
    return { filesProcessed: 0, atomCount: 0, recipeCount: 0, slotRecipeCount: 0 }
  }
  compile() {
    return emptyCompileOutput()
  }
  getLayerCss(_options: LayerCssOptions) {
    return emptyCompileOutput()
  }
  getSplitCss(_options?: SplitCssOptions) {
    return []
  }
  readonly buildInfo = fallbackBuildInfo
  readonly designSystem = fallbackDesignSystem
  generateArtifacts() {
    return []
  }
  generateArtifact() {
    return undefined
  }
  generateAffectedArtifacts() {
    return []
  }
  diagnostics() {
    return [] as Diagnostic[]
  }
}

/** No-op binding used when the native `compiler.node` can't be loaded (e.g.
 *  unsupported platform). Mirrors {@link NativeBinding} so callers degrade
 *  gracefully to empty results instead of crashing. */
export const fallback: NativeBinding = {
  startTracing() {
    return false
  },
  flushTracing() {
    /* no-op */
  },
  shutdownTracing() {
    return false
  },
  compile() {
    return emptyCompileOutput()
  },
  scanImports() {
    return { imports: [], diagnostics: [] }
  },
  matchImports() {
    return []
  },
  extractCalls() {
    return { calls: [], diagnostics: [] }
  },
  extractJsx() {
    return { jsx: [], diagnostics: [] }
  },
  extract() {
    return { calls: [], jsx: [], diagnostics: [] }
  },
  extractDebug() {
    return { imports: [], matched: [], calls: [], jsx: [], diagnostics: [] }
  },
  Extractor: FallbackExtractor as unknown as ExtractorSessionConstructor,
  Compiler: FallbackCompiler as unknown as CompilerConstructor,
}

function emptyCompileOutput(): CompileOutput {
  return {
    css: '',
    manifest: { files: [], tokens: [] },
    layerRanges: {},
    diagnostics: [],
  }
}

function emptyWriteCssResult(path: string): WriteCssResult {
  return {
    path,
    ...emptyCompileOutput(),
  }
}

function emptyWriteFilesResult(root: string): WriteFilesResult {
  return {
    root,
    paths: [],
    files: [],
  }
}
