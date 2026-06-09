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
 *  live preview scope (the preview evals everything in one scope, so each file's
 *  `export const`s become locals — `import`/`export *` lines must go). */
export function artifactsPreviewJs(artifacts: LegacyArtifact[]): string {
  return artifacts
    .flatMap((artifact) => artifact.files.filter((file) => file.file.endsWith('.js')))
    .map((file) => stripModuleSyntax(file.code))
    .join('\n')
}

function stripModuleSyntax(code = ''): string {
  return code
    .replace(/^import\b[\s\S]*?from\s*['"][^'"]+['"];?/gm, '') // `import … from '…'` (incl. multi-line)
    .replace(/^import\s*['"][^'"]+['"];?/gm, '') // side-effect `import '…'`
    .replace(/^export\s+\*\s+from\s*['"][^'"]+['"];?/gm, '') // re-exports (defs live in the imported file)
    .replace(/^\s*["']use (client|strict)["'];?\s*$/gm, '') // directives are meaningless in the eval scope
}
