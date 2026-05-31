import type { ArtifactFilter, CodegenArtifact, Compiler } from '@pandacss/compiler-shared'

/** Full codegen set, or only the artifacts affected by a config diff. */
export function selectArtifacts(compiler: Compiler, filter?: ArtifactFilter): CodegenArtifact[] {
  return filter?.dependencies ? compiler.generateAffectedArtifacts(filter.dependencies) : compiler.generateArtifacts()
}
