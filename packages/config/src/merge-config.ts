import type { AnyFunction, Config, PandaHooks } from '@pandacss/types'
import { mergeAndConcat } from 'merge-anything'
import { assign, mergeWith } from './utils'

type Extendable<T> = T & { extend?: T }
interface Dict {
  [key: string]: any
}
type ExtendableRecord = Extendable<Dict>
type ExtendableConfig = Extendable<Config>

/**
 * Collect all `extend` properties into an array (to avoid mutation)
 */
function getExtends(items: ExtendableRecord[]) {
  return items.reduce((merged, { extend }) => {
    if (!extend) return merged

    return mergeWith(merged, extend, (originalValue: any, newValue: any) => {
      if (newValue === undefined) {
        return originalValue ?? []
      }

      if (originalValue === undefined) {
        return [newValue]
      }

      if (Array.isArray(originalValue)) {
        return [newValue, ...originalValue]
      }

      return [newValue, originalValue]
    })
  }, {})
}

/**
 * Separate the `extend` properties from the rest of the object
 */
function mergeRecords(records: ExtendableRecord[]) {
  return {
    ...records.reduce((acc, record) => assign(acc, record), {}),
    extend: getExtends(records),
  }
}

/**
 * Merge all `extend` properties into the rest of the object
 */
function mergeExtensions(records: ExtendableRecord[]) {
  const { extend = [], ...restProps } = mergeRecords(records)
  return mergeWith(restProps, extend, (obj: any, extensions: any[]) => {
    return mergeAndConcat({}, obj, ...extensions)
  })
}

const isEmptyObject = (obj: any) => typeof obj === 'object' && Object.keys(obj).length === 0

const compact = (obj: any) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined && !isEmptyObject(obj[key])) {
      acc[key] = obj[key]
    }
    return acc
  }, {} as any)
}

export const mergeHooks = (hooksMaps: Array<Partial<PandaHooks>>) => {
  const hooksFns: Partial<Record<keyof PandaHooks, Set<AnyFunction>>> = {}

  hooksMaps.forEach((hooks) => {
    Object.entries(hooks).forEach(([key, value]) => {
      if (!hooksFns[key as keyof PandaHooks]) {
        hooksFns[key as keyof PandaHooks] = new Set()
      }

      hooksFns[key as keyof PandaHooks]!.add(value)
    })
  })

  return Object.fromEntries(
    Object.entries(hooksFns).map(([key, fns]) => {
      // Special case for this hook, the only one that uses its return to update the state
      // Each fn is called sequentially and the result of the previous hook is passed to the next hook
      if (key === 'cssgen:done') {
        const reducer: PandaHooks['cssgen:done'] = (args) => {
          let content = args.content

          for (const hookFn of fns) {
            const result = hookFn({ ...args, content, original: args.content })

            // it's fine to not return anything, it will just be ignored
            if (result !== undefined) {
              content = result
            }
          }

          return content
        }

        return [key, reducer]
      }

      return [key, syncHooks.includes(key) ? callAll(...fns) : callAllAsync(...fns)]
    }),
  ) as Partial<PandaHooks>
}

/**
 * Merge all configs into a single config
 */
export function mergeConfigs(configs: ExtendableConfig[]) {
  const mergedResult = assign(
    {
      conditions: mergeExtensions(configs.map((config) => config.conditions ?? {})),
      theme: mergeExtensions(configs.map((config) => config.theme ?? {})),
      patterns: mergeExtensions(configs.map((config) => config.patterns ?? {})),
      utilities: mergeExtensions(configs.map((config) => config.utilities ?? {})),
      globalCss: mergeExtensions(configs.map((config) => config.globalCss ?? {})),
      staticCss: mergeExtensions(configs.map((config) => config.staticCss ?? {})),
      hooks: mergeHooks(
        configs
          .filter((config) => config.hooks)
          .map((config) => config.hooks!)
          .reverse(),
      ),
    },
    ...configs,
  )

  return compact(mergedResult)
}

const syncHooks = ['context:created', 'parser:before', 'parser:after']
// const asyncHooks = ["config:resolved", "config:change", "codegen:done", "cssgen:done"]

const callAllAsync =
  <T extends (...a: any[]) => void | Promise<void>>(...fns: (T | undefined)[]) =>
  async (...a: Parameters<T>) => {
    for (const fn of fns) {
      await fn?.(...a)
    }
  }

const callAll =
  <T extends (...a: any[]) => void | Promise<void>>(...fns: (T | undefined)[]) =>
  (...a: Parameters<T>) => {
    fns.forEach((fn) => fn?.(...a))
  }
