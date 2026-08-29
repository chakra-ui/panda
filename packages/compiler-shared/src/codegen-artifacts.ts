import type { CodegenPrepareArtifact } from '@pandacss/types'
import type { CodegenArtifact, CodegenDependency } from './types'

const CODEGEN_DEPENDENCIES = new Set<string>([
  'outExtension',
  'forceImportExtension',
  'conditions',
  'hash',
  'jsxFactory',
  'jsxFramework',
  'jsxStyleProps',
  'patterns',
  'prefix',
  'recipes',
  'separator',
  'themes',
  'tokens',
  'utilities',
])

function isCodegenDependency(value: string): value is CodegenDependency {
  return CODEGEN_DEPENDENCIES.has(value)
}

/** Map `codegen:prepare` hook output onto the compiler artifact contract. */
export function fromCodegenPrepareArtifacts(artifacts: CodegenPrepareArtifact[]): CodegenArtifact[] {
  return artifacts.map((artifact) => ({
    id: artifact.id,
    files: artifact.files.map((file) => ({
      path: file.path,
      code: file.code,
      dependencies: file.dependencies.filter(isCodegenDependency),
    })),
  }))
}
