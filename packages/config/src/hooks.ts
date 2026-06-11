import type { ProjectCallbackKind, ProjectHooks, SerializedHookFilter } from '@pandacss/compiler-shared'
import type { HookRegistry, UserConfig } from '@pandacss/types'

export type HookSerializationCallbacks = Partial<Record<ProjectCallbackKind, Record<string, Function>>>

type Sanitize = (value: unknown, path: string[], callbacks: HookSerializationCallbacks) => any
type HashCallbackSource = (fn: Function) => string

const compact = <T extends Record<string, any>>(value: T): T =>
  Object.fromEntries(Object.entries(value ?? {}).filter(([, item]) => item !== undefined)) as T

export interface PluginHookEntry<Name extends keyof HookRegistry> {
  pluginIndex: number
  name: string | undefined
  value: HookRegistry[Name]
}

export type HostHooks = {
  'codegen:prepare'?: Array<PluginHookEntry<'codegen:prepare'>>
  'codegen:done'?: Array<PluginHookEntry<'codegen:done'>>
}

export function serializeHooks(
  config: UserConfig,
  callbacks: HookSerializationCallbacks,
  sanitize: Sanitize,
  hashCallbackSource: HashCallbackSource,
): ProjectHooks | undefined {
  const parserBefore = collectPluginHookHandlers(config, 'parser:before').map((entry, index) => {
    const hook = normalizeHook(entry.value, 'parser:before')
    const id = `plugins.${entry.pluginIndex}.hooks.parser:before.${index}`
    callbacks['parser:before'] ??= {}
    callbacks['parser:before']![id] = hook.handler

    return compact({
      id,
      name: entry.name,
      filter: hook.filter
        ? (sanitize(
            hook.filter,
            ['plugins', String(entry.pluginIndex), 'hooks', 'parser:before', 'filter'],
            callbacks,
          ) as SerializedHookFilter)
        : undefined,
      hash: hashCallbackSource(hook.handler),
    })
  })

  return parserBefore.length > 0 ? { 'parser:before': parserBefore } : undefined
}

export function collectPluginHookHandlers<Name extends keyof HookRegistry>(config: UserConfig, name: Name) {
  const entries: Array<PluginHookEntry<Name>> = []
  const plugins = [...(config.plugins ?? [])]

  plugins.forEach((plugin, pluginIndex) => {
    const value = plugin.hooks?.[name]
    if (value) entries.push({ pluginIndex, name: plugin.name, value })
  })

  return entries
}

export function normalizeHook(value: unknown, name: keyof HookRegistry): { filter?: unknown; handler: Function } {
  if (typeof value === 'function') return { handler: value }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${name} hook. Expected a function or { filter, handler }.`)
  }

  const record = value as Record<string, unknown>
  if (typeof record.handler !== 'function') {
    throw new Error(`Invalid ${name} hook. Expected a function or { filter, handler }.`)
  }

  return { filter: record.filter, handler: record.handler }
}
