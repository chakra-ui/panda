import {
  createPatternHelpers,
  createTransformArgs,
  getPatternDefaultValueRefsByTransformId,
  mergePatternDefaultValues,
} from '@pandacss/compiler-shared'
import type { ProjectCallbacks, TokenLookup } from '@pandacss/compiler-shared'
import type { RawCompiler } from './index'

export type { ColorMixResult, PatternHelpers, RawToken, TransformArgs } from '@pandacss/compiler-shared'

/** Wire JS-backed transform callbacks into a freshly-constructed native
 *  instance. The shared runtime ([`@pandacss/compiler-shared`]) owns the
 *  validation + helper construction; only the instance plumbing lives here. */
export function registerCallbacks(
  project: RawCompiler,
  callbacks: ProjectCallbacks,
  tokenDictionary: TokenLookup | undefined,
) {
  const utilityTransforms = callbacks['utility.transform']
  const hasUtilityTransforms = !!utilityTransforms && Object.keys(utilityTransforms).length > 0
  const patternTransforms = callbacks['pattern.transform']
  const hasPatternTransforms = !!patternTransforms && Object.keys(patternTransforms).length > 0

  const config = project.config()
  const patternDefaultValues = callbacks['pattern.defaultValues']
  const patternDefaultValueRefs =
    config && patternDefaultValues ? getPatternDefaultValueRefsByTransformId(config) : new Map<string, string>()
  if (hasPatternTransforms && !project.registerPatternTransform) {
    throw new Error('Native project does not support pattern.transform callbacks')
  }
  if (project.registerPatternTransform && patternTransforms) {
    for (const [id, callback] of Object.entries(patternTransforms)) {
      const defaultValueId = patternDefaultValueRefs.get(id)
      const defaultValue = defaultValueId ? patternDefaultValues?.[defaultValueId] : undefined
      project.registerPatternTransform(id, (props) => {
        const input = props as Record<string, any>
        const nextProps = (defaultValue ? mergePatternDefaultValues(defaultValue(input), input) : input) as Record<
          string,
          any
        >
        return callback(nextProps, createPatternHelpers())
      })
    }
  }

  if (hasUtilityTransforms && !project.registerUtilityTransform) {
    throw new Error('Native project does not support utility.transform callbacks')
  }
  if (project.registerUtilityTransform && utilityTransforms) {
    for (const [id, callback] of Object.entries(utilityTransforms)) {
      project.registerUtilityTransform(id, (value) => {
        const raw = value as string
        return callback(raw, createTransformArgs(raw, tokenDictionary))
      })
    }
  }
}
