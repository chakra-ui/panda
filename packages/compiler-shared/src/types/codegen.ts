export type CodegenArtifactId =
  | 'conditions'
  | 'css-index'
  | 'cx'
  | 'helpers'
  | 'jsx-create-recipe-context'
  | 'jsx-create-slot-recipe-context'
  | 'jsx-factory'
  | 'jsx-index'
  | 'jsx-is-valid-prop'
  | 'jsx-patterns'
  | 'patterns'
  | 'themes'
  | 'types'

export type CodegenDependency =
  | 'outExtension'
  | 'forceImportExtension'
  | 'conditions'
  | 'hash'
  | 'jsxFactory'
  | 'jsxFramework'
  | 'jsxStyleProps'
  | 'patterns'
  | 'prefix'
  | 'recipes'
  | 'separator'
  | 'syntax'
  | 'themes'
  | 'tokens'
  | 'utilities'

export interface GenerateArtifactOptions {
  forceImportExtension?: boolean
}

export interface CodegenOptions extends GenerateArtifactOptions {
  outdir?: string
  cwd?: string
}

export interface WriteArtifactsOptions extends GenerateArtifactOptions {
  outdir: string
  cwd?: string
  artifacts?: CodegenArtifact[]
}

export interface CodegenFile {
  path: string
  code: string
  dependencies: CodegenDependency[]
}

export interface CodegenArtifact {
  id: CodegenArtifactId
  files: CodegenFile[]
}
