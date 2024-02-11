import { logger } from '@pandacss/logger'
import type { AnyFunction, PandaHooks, PandaPlugin } from '@pandacss/types'

type HookEntry = [pluginName: string, cb: AnyFunction]

export const mergeHooks = (plugins: PandaPlugin[]) => {
  const hooksFns: Partial<Record<keyof PandaHooks, HookEntry[]>> = {}

  plugins.forEach(({ name, hooks }) => {
    Object.entries(hooks ?? {}).forEach(([key, value]) => {
      if (!hooksFns[key as keyof PandaHooks]) {
        hooksFns[key as keyof PandaHooks] = [] as HookEntry[]
      }

      hooksFns[key as keyof PandaHooks]!.push([name, value])
    })
  })

  const mergedHooks = Object.fromEntries(
    Object.entries(hooksFns).map(([key, entries]) => {
      const fns = entries.map(([name, fn]) => tryCatch(name, fn))

      // Those special hooks use their callback return to update the internal state
      // Each fn is called sequentially and the result of the previous hook is passed to the next hook
      if (key === 'cssgen:done') {
        return [key, reducers['cssgen:done'](fns)]
      }

      if (key === 'codegen:prepare') {
        return [key, reducers['codegen:prepare'](fns)]
      }

      return [key, syncHooks.includes(key) ? callAll(...fns) : callAllAsync(...fns)]
    }),
  ) as Partial<PandaHooks>

  return mergedHooks
}

const reducers = {
  'cssgen:done':
    (fns: AnyFunction[]): PandaHooks['cssgen:done'] =>
    (args) => {
      let content = args.content
      for (const hookFn of fns) {
        const result = hookFn({ ...args, content, original: args.content })
        if (result !== undefined) {
          content = result
        }
      }
      return content
    },
  'codegen:prepare':
    (fns: AnyFunction[]): PandaHooks['codegen:prepare'] =>
    (args) => {
      let artifacts = args.artifacts

      for (const hookFn of fns) {
        const result = hookFn({ ...args, artifacts, original: args.artifacts })

        // it's fine to not return anything, it will just be ignored
        if (result) {
          artifacts = result
        }
      }

      return artifacts
    },
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

const tryCatch = (name: string, fn: AnyFunction) => {
  return (...args: any[]) => {
    try {
      return fn(...args)
    } catch (e) {
      logger.error('hooks', `The error below comes from the plugin ${name}`)
      console.error(e)
    }
  }
}
