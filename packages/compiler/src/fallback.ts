import type { Atom, Compiler, Diagnostic } from '@pandacss/compiler-shared'
import type { CompilerConstructor, ExtractorSession, ExtractorSessionConstructor, NativeBinding } from './types'

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
  parseFiles(_paths: string[]) {
    return []
  }
  layers() {
    return { reset: 'reset', base: 'base', tokens: 'tokens', recipes: 'recipes', utilities: 'utilities' }
  }
  spec() {
    return {
      conditions: { keys: [], breakpoints: [] },
      tokens: { categories: {}, colorPalettes: [], values: {}, deprecated: [] },
      utilities: { properties: {}, shorthands: {}, deprecated: [] },
      patterns: { patterns: {} },
      recipes: { recipes: {}, slotRecipes: {} },
      propertyOrder: [],
    }
  }
  sources() {
    return []
  }
  inspectFileSource() {
    return { usages: [], diagnostics: [] }
  }
  writeArtifacts() {
    return []
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
    return {
      css: '',
      manifest: { files: [], tokens: [] },
      layerRanges: {},
      diagnostics: [],
    }
  }
  layerCss() {
    return ''
  }
  splitCss() {
    return []
  }
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
    return {
      css: '',
      manifest: { files: [], tokens: [] },
      layerRanges: {},
      diagnostics: [],
    }
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
