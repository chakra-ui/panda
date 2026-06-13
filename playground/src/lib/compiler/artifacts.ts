import type { CodegenArtifact } from '@pandacss/compiler-wasm/web'

export interface LegacyArtifactFile {
  file: string
  code: string
}

export interface LegacyArtifact {
  files: LegacyArtifactFile[]
  dir?: string[]
}

/**
 * Adapt wasm `generateArtifacts()` output to the shape the playground's editor
 * and preview expect. Wasm files carry an outdir-relative `path`
 * (`css/index.mjs`); we keep that as `file` and root `dir` at the outdir so
 * `dir.join('/') + '/' + file` reconstructs `styled-system/css/index.mjs`.
 */
export function toLegacyArtifacts(artifacts: CodegenArtifact[], outdir = 'styled-system'): LegacyArtifact[] {
  return artifacts.map((artifact) => ({
    dir: [outdir],
    files: artifact.files.map((file) => ({ file: file.path, code: file.code })),
  }))
}

/** Runtime `.js` files across all artifacts, module syntax stripped, for the
 *  live preview scope. Files are ordered so dependencies (helpers → conditions
 *  → css → patterns → recipes → jsx) initialize before dependents. */
export function artifactsPreviewJs(artifacts: LegacyArtifact[]): string {
  const files = artifacts
    .flatMap((artifact) => artifact.files.filter((file) => file.file.endsWith('.js')))
    .sort((a, b) => previewJsRank(a.file) - previewJsRank(b.file) || a.file.localeCompare(b.file))
    .map((file) => stripModuleSyntax(file.code))

  return [PREVIEW_REACT_PREAMBLE, ...files].join('\n')
}

const PREVIEW_REACT_PREAMBLE = 'const { createContext, useContext, createElement, forwardRef } = React'

const PREVIEW_JS_RANK: Record<string, number> = {
  'helpers.js': 0,
  'tokens/index.js': 10,
  'css/conditions.js': 20,
  'css/css.js': 30,
  'css/cva.js': 31,
  'css/sva.js': 32,
  'css/cx.js': 33,
  'css/index.js': 90,
  'patterns/runtime.js': 100,
  'recipes/runtime.js': 110,
  'jsx/helper.js': 120,
  'jsx/is-valid-prop.js': 121,
  'jsx/factory.js': 122,
  'jsx/create-recipe-context.js': 123,
  'jsx/create-slot-recipe-context.js': 124,
  'patterns/index.js': 190,
  'recipes/index.js': 191,
  'jsx/index.js': 192,
}

function previewJsRank(path: string): number {
  if (path in PREVIEW_JS_RANK) return PREVIEW_JS_RANK[path]!
  if (path.startsWith('patterns/')) return 150
  if (path.startsWith('recipes/')) return 160
  if (path.startsWith('jsx/')) return 170
  if (path.startsWith('css/')) return 40
  return 200
}

function stripModuleSyntax(code = ''): string {
  return code
    .replace(/^import\b[\s\S]*?from\s*['"][^'"]+['"];?/gm, '') // `import … from '…'` (incl. multi-line)
    .replace(/^import\s*['"][^'"]+['"];?/gm, '') // side-effect `import '…'`
    .replace(/^export\s+\*\s+from\s*['"][^'"]+['"];?/gm, '') // re-exports (defs live in the imported file)
    .replace(/^export\s+/gm, '') // declarations become locals in the eval scope
    .replace(/^\s*["']use (client|strict)["'];?\s*$/gm, '') // directives are meaningless in the eval scope
}
