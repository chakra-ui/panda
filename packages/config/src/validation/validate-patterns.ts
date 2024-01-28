import type { Patterns } from '@pandacss/types'
import type { ArtifactNames } from '../types'

export const validatePatterns = (patterns: Patterns | undefined, names: ArtifactNames) => {
  if (!patterns) return

  Object.keys(patterns).forEach((patternName) => {
    names.patterns.add(patternName)
  })
}
