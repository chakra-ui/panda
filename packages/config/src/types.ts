import type { Config } from '@pandacss/types'

export interface AddError {
  (scope: string, message: string): void
}

export interface ConfigFileOptions {
  cwd: string
  file?: string
  customConditions?: string[]
}

export interface TokensData {
  tokenNames: Set<string>
  semanticTokenNames: Set<string>
  valueAtPath: Map<string, any>
  refsByPath: Map<string, Set<string>>
  typeByPath: Map<string, 'tokens' | 'semanticTokens'>
}

export interface ArtifactNames {
  recipes: Set<string>
  slotRecipes: Set<string>
  patterns: Set<string>
}

export interface BundleConfigResult<T = Config> {
  config: T
  dependencies: string[]
  path: string
}
