import type { Atom, TokenDictionaryInput, WasmProject, WasmProjectCallbacks, WasmProjectOptions } from './types'

interface RawToken {
  path: string
  value: string
  var?: string
}

interface ColorMixResult {
  invalid: boolean
  value: string
  color?: string
}

interface TransformArgs {
  token: ((path: string) => string | undefined) & { raw: (path: string) => RawToken | undefined }
  raw: unknown
  utils: {
    colorMix(value: string): ColorMixResult
  }
}

export function wrapProjectCallbacks(project: WasmProject, options: WasmProjectOptions | undefined): WasmProject {
  const callbacks = options?.callbacks
  const config = options?.config
  const tokenDictionary = options?.tokenDictionary
  if (!callbacks?.['utility.transform'] || Object.keys(callbacks['utility.transform']).length === 0 || !config) {
    return project
  }
  const utilityTransformCache = new Map<string, Atom[]>()

  return {
    config: () => project.config(),
    parseFile: (path, source) => project.parseFile(path, source),
    refreshFile: (path, source) => project.refreshFile(path, source),
    removeFile: (path) => project.removeFile(path),
    clear: () => {
      utilityTransformCache.clear()
      project.clear()
    },
    isEmpty: () => project.isEmpty(),
    atoms: () =>
      applyUtilityTransformCallbacks(project.atoms(), config, callbacks, utilityTransformCache, tokenDictionary),
    recipes: () => project.recipes(),
    slotRecipes: () => project.slotRecipes(),
    summary: () => project.summary(),
  } as WasmProject
}

export function assertProjectCallbacks(config: Record<string, unknown>, callbacks: WasmProjectCallbacks) {
  assertCallbackRefs('utility.values', getUtilityValueRefs(config), callbacks['utility.values'])
  assertCallbackRefs('utility.transform', getUtilityTransformRefs(config), callbacks['utility.transform'])
  assertCallbackRefs('pattern.transform', getPatternTransformRefs(config), callbacks['pattern.transform'])
}

export function resolveUtilityValueCallbacks(
  config: Record<string, unknown>,
  callbacks: WasmProjectCallbacks,
  tokenDictionary: TokenDictionaryInput | undefined,
): Record<string, unknown> {
  const valuesCallbacks = callbacks['utility.values']
  if (!valuesCallbacks || Object.keys(valuesCallbacks).length === 0) return config

  const utilities = config.utilities
  if (!utilities || typeof utilities !== 'object' || Array.isArray(utilities)) return config

  let changed = false
  const nextUtilities: Record<string, unknown> = {}
  for (const [prop, utility] of Object.entries(utilities as Record<string, unknown>)) {
    if (!utility || typeof utility !== 'object' || Array.isArray(utility)) {
      nextUtilities[prop] = utility
      continue
    }

    const values = (utility as Record<string, unknown>).values
    const id = isCallbackRef(values) ? values.id : undefined
    const callback = id ? valuesCallbacks[id] : undefined
    if (!callback) {
      nextUtilities[prop] = utility
      continue
    }

    nextUtilities[prop] = {
      ...(utility as Record<string, unknown>),
      values: callback((category: string) => getTokenCategoryValues(category, tokenDictionary)),
    }
    changed = true
  }

  return changed ? { ...config, utilities: nextUtilities } : config
}

function assertCallbackRefs(kind: string, refs: Map<string, string>, callbacks: Record<string, Function> | undefined) {
  for (const [name, id] of refs) {
    if (!callbacks?.[id]) {
      throw new Error(`Missing ${kind} callback \`${id}\` for \`${name}\``)
    }
  }
}

function applyUtilityTransformCallbacks(
  atoms: Atom[],
  config: Record<string, unknown>,
  callbacks: WasmProjectCallbacks,
  cache: Map<string, Atom[]>,
  tokenDictionary: TokenDictionaryInput | undefined,
): Atom[] {
  const transforms = callbacks['utility.transform']
  if (!transforms) return atoms

  const utilityTransforms = getUtilityTransformRefs(config)
  if (utilityTransforms.size === 0) return atoms

  return atoms.flatMap((atom) => {
    const id = utilityTransforms.get(atom.prop)
    const transform = id ? transforms[id] : undefined
    if (!transform) return [atom]

    const cacheKey = `${id}\0${atom.prop}\0${JSON.stringify(atom.value)}`
    const cached = cache.get(cacheKey)
    if (cached) return applyConditions(cached, atom.conditions)

    const result = transform(atom.value, createTransformArgs(atom.value, tokenDictionary))

    if (!result || typeof result !== 'object' || Array.isArray(result)) return []
    const transformed = styleObjectToAtoms(result as Record<string, unknown>, [])
    cache.set(cacheKey, transformed)
    return applyConditions(transformed, atom.conditions)
  })
}

function createTransformArgs(raw: unknown, tokenDictionary: TokenDictionaryInput | undefined): TransformArgs {
  const token = Object.assign((path: string) => tokenDictionary?.vars[path] ?? tokenDictionary?.values[path], {
    raw: (path: string): RawToken | undefined => {
      const value = tokenDictionary?.values[path]
      if (value == null) return undefined
      const variable = tokenDictionary?.vars[path]
      return variable == null ? { path, value } : { path, value, var: variable }
    },
  })

  return {
    raw,
    token,
    utils: {
      colorMix: (value: string) => colorMix(value, token),
    },
  }
}

function colorMix(value: string, token: TransformArgs['token']): ColorMixResult {
  if (!value || typeof value !== 'string') return { invalid: true, value }

  const [rawColor, rawOpacity] = value.split('/')
  if (!rawColor || !rawOpacity) return { invalid: true, value: rawColor }

  const colorToken = token(`colors.${rawColor}`)
  const opacityToken = token.raw(`opacity.${rawOpacity}`)?.value

  if (!opacityToken && isNaN(Number(rawOpacity))) return { invalid: true, value: rawColor }

  const percent = opacityToken ? Number(opacityToken) * 100 + '%' : `${rawOpacity}%`
  const color = colorToken ?? rawColor

  return {
    invalid: false,
    color,
    value: `color-mix(in srgb, ${color} ${percent}, transparent)`,
  }
}

function getTokenCategoryValues(category: string, tokenDictionary: TokenDictionaryInput | undefined) {
  if (!tokenDictionary) return undefined

  const prefix = `${category}.`
  const out: Record<string, string> = {}
  for (const [path, value] of Object.entries(tokenDictionary.values)) {
    if (path.startsWith(prefix)) out[path.slice(prefix.length)] = value
  }

  return Object.keys(out).length > 0 ? out : undefined
}

function getUtilityTransformRefs(config: Record<string, unknown>) {
  const refs = new Map<string, string>()
  const utilities = config.utilities
  if (!utilities || typeof utilities !== 'object' || Array.isArray(utilities)) return refs

  for (const [prop, utility] of Object.entries(utilities as Record<string, unknown>)) {
    if (!utility || typeof utility !== 'object' || Array.isArray(utility)) continue
    const transform = (utility as Record<string, unknown>).transform
    if (isCallbackRef(transform)) refs.set(prop, transform.id)
  }

  return refs
}

function getUtilityValueRefs(config: Record<string, unknown>) {
  const refs = new Map<string, string>()
  const utilities = config.utilities
  if (!utilities || typeof utilities !== 'object' || Array.isArray(utilities)) return refs

  for (const [prop, utility] of Object.entries(utilities as Record<string, unknown>)) {
    if (!utility || typeof utility !== 'object' || Array.isArray(utility)) continue
    const values = (utility as Record<string, unknown>).values
    if (isCallbackRef(values)) refs.set(prop, values.id)
  }

  return refs
}

function getPatternTransformRefs(config: Record<string, unknown>) {
  const refs = new Map<string, string>()
  collectPatternTransformRefs(config.patterns, refs)
  return refs
}

function collectPatternTransformRefs(value: unknown, refs: Map<string, string>) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  collectPatternTransformRefMap(value as Record<string, unknown>, refs)
  const extend = (value as Record<string, unknown>).extend
  if (extend && typeof extend === 'object' && !Array.isArray(extend)) {
    collectPatternTransformRefMap(extend as Record<string, unknown>, refs)
  }
}

function collectPatternTransformRefMap(patterns: Record<string, unknown>, refs: Map<string, string>) {
  for (const [name, pattern] of Object.entries(patterns)) {
    if (name === 'extend' || !pattern || typeof pattern !== 'object' || Array.isArray(pattern)) continue
    const transform = (pattern as Record<string, unknown>).transform
    if (isCallbackRef(transform)) refs.set(name, transform.id)
  }
}

function isCallbackRef(value: unknown): value is { kind: 'js-callback'; id: string } {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).kind === 'js-callback' &&
    typeof (value as Record<string, unknown>).id === 'string'
  )
}

function styleObjectToAtoms(style: Record<string, unknown>, baseConditions: string[]): Atom[] {
  const atoms: Atom[] = []
  walkStyle(style, [], baseConditions, atoms)
  return atoms.sort(compareAtoms)
}

function walkStyle(value: unknown, path: string[], baseConditions: string[], atoms: Atom[]) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      walkStyle(child, path.concat(key), baseConditions, atoms)
    }
    return
  }

  const prop = path[0]
  if (!prop) return
  atoms.push({
    prop,
    value: normalizeAtomValue(value),
    conditions: [...baseConditions],
  })
}

function normalizeAtomValue(value: unknown): Atom['value'] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null)
    return value
  if (Array.isArray(value)) return `[${value.join(',')}]`
  return String(value)
}

function applyConditions(atoms: Atom[], conditions: string[]): Atom[] {
  if (conditions.length === 0) return atoms
  return atoms.map((atom) => ({ ...atom, conditions: [...conditions] }))
}

function compareAtoms(a: Atom, b: Atom) {
  return (
    a.prop.localeCompare(b.prop) ||
    a.conditions.join('\0').localeCompare(b.conditions.join('\0')) ||
    String(a.value).localeCompare(String(b.value))
  )
}
