import {
  createPatternHelpers,
  createTransformArgs,
  getPatternDefaultValueRefsByTransformId,
  mergePatternDefaultValues,
} from '@pandacss/compiler-shared'
import type { ProjectCallbacks, ProjectHooks, TokenLookup } from '@pandacss/compiler-shared'
import type { WasmCompiler } from './types'

export type { PatternHelpers } from '@pandacss/compiler-shared'

export function registerCallbacks(
  project: WasmCompiler,
  callbacks: ProjectCallbacks,
  hooks: ProjectHooks | undefined,
  tokenDictionary: TokenLookup | undefined,
) {
  const utilityTransforms = callbacks['utility.transform']
  if (utilityTransforms && Object.keys(utilityTransforms).length > 0 && !project.registerUtilityTransform) {
    throw new Error('WASM project does not support utility.transform callbacks')
  }
  if (project.registerUtilityTransform && utilityTransforms && Object.keys(utilityTransforms).length > 0) {
    for (const [id, callback] of Object.entries(utilityTransforms)) {
      // Native passes the resolved value first, the original alias second (`args.raw`).
      project.registerUtilityTransform(id, (resolved, original) => {
        return callback(resolved as string, createTransformArgs(original, tokenDictionary))
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

  const sourceTransforms = hooks?.['parser:before']
  if (sourceTransforms?.length && !project.registerSourceTransform) {
    throw new Error('WASM project does not support parser:before callbacks')
  }
  if (project.registerSourceTransform && sourceTransforms) {
    for (const hook of sourceTransforms) {
      const callback = callbacks['parser:before']?.[hook.id]
      if (!callback) continue
      project.registerSourceTransform(hook.id, hook.filter, (filePath, content) => {
        const result = callback({ filePath: String(filePath), content: String(content), original: String(content) })
        if (isPromiseLike(result)) {
          throw new Error(`parser:before callback \`${hook.id}\` must be synchronous`)
        }
        return typeof result === 'string' ? result : undefined
      })
    }
  }
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    !!value && (typeof value === 'object' || typeof value === 'function') && typeof (value as any).then === 'function'
  )
}
