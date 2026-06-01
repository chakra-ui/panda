import {
  createPatternHelpers,
  createTransformArgs,
  getPatternDefaultValueRefsByTransformId,
  mergePatternDefaultValues,
} from '@pandacss/compiler-shared'
import type { ProjectCallbacks, TokenLookup } from '@pandacss/compiler-shared'
import type { WasmCompiler } from './types'

export type { PatternHelpers } from '@pandacss/compiler-shared'

export function registerCallbacks(
  project: WasmCompiler,
  callbacks: ProjectCallbacks,
  tokenDictionary: TokenLookup | undefined,
) {
  const utilityTransforms = callbacks['utility.transform']
  if (utilityTransforms && Object.keys(utilityTransforms).length > 0 && !project.registerUtilityTransform) {
    throw new Error('WASM project does not support utility.transform callbacks')
  }
  if (project.registerUtilityTransform && utilityTransforms && Object.keys(utilityTransforms).length > 0) {
    for (const [id, callback] of Object.entries(utilityTransforms)) {
      project.registerUtilityTransform(id, (value) => {
        const raw = value as string
        return callback(raw, createTransformArgs(raw, tokenDictionary))
      })
    }
  }

  const patternTransforms = callbacks['pattern.transform']
  if (patternTransforms && Object.keys(patternTransforms).length > 0 && !project.registerPatternTransform) {
    throw new Error('WASM project does not support pattern.transform callbacks')
  }
  const config = project.config()
  const patternDefaultValues = callbacks['pattern.defaultValues']
  const patternDefaultValueRefs =
    config && patternDefaultValues ? getPatternDefaultValueRefsByTransformId(config) : new Map<string, string>()
  if (project.registerPatternTransform && patternTransforms && Object.keys(patternTransforms).length > 0) {
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
}
