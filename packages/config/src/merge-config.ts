import type { AnyFunction, Config, ExtendableOptions, PandaHooks } from '@pandacss/types'
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

/**
 * Merge all hooks (from config + presets) into a single object
 * The only case where both config+preset hooks are called is when both have an `extend` property
 * Otherwise, the non-extendable hooks will override the extendable ones, with a priority to the config hooks (in case of conflict with those from presets)
 *
 * config.extend + preset.extend -> will call [preset.extend, config.extend]
 * config + preset.extend -> will call [config]
 * config + preset -> will call [config]
 * config.extend + preset -> will call [preset]
 */
export const mergeHooks = (hooksMaps: Array<NonNullable<ExtendableOptions['hooks']>>) => {
  const [configHooks = {}, ...presetHooks] = hooksMaps

  const extendableFns: Partial<Record<keyof PandaHooks, Set<AnyFunction>>> = {}

  hooksMaps.forEach((hooks) => {
    const { extend } = hooks
    if (extend) {
      Object.entries(extend).forEach(([key, value]) => {
        if (!extendableFns[key as keyof PandaHooks]) {
          extendableFns[key as keyof PandaHooks] = new Set()
        }

        extendableFns[key as keyof PandaHooks]!.add(value)
      })
    }
  })

  const mergedHooks = Object.fromEntries(
    Object.entries(extendableFns).map(([_key, fns]) => {
      const key = _key as keyof PandaHooks

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
      } else if (key === 'codegen:prepare') {
        const reducer: PandaHooks['codegen:prepare'] = (args) => {
          let artifacts = args.artifacts

          for (const hookFn of fns) {
            const result = hookFn({ ...args, artifacts, original: args.artifacts })

            // it's fine to not return anything, it will just be ignored
            if (result) {
              artifacts = result
            }
          }

          return artifacts
        }

        return [key, reducer]
      }

      return [key, syncHooks.includes(key) ? callAll(...fns) : callAllAsync(...fns)]
    }),
  ) as Partial<PandaHooks>

  // Make the non-extendable hooks from the presets override the extendable ones
  presetHooks?.forEach((hooks) => {
    const { extend, ...callbacks } = hooks

    Object.entries(callbacks).forEach(([key, value]) => {
      mergedHooks[key as keyof PandaHooks] = value as any
    })
  })

  // Make the non-extendable hooks from the main config override the extendable ones
  Object.entries(configHooks).forEach(([key, value]) => {
    if (key === 'extend') return
    mergedHooks[key as keyof PandaHooks] = value as any
  })

  return mergedHooks
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

const syncHooks = ['context:created', 'parser:before', 'parser:after', 'cssgen:done']

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
