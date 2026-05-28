import type { TokenDictionaryInput, WasmProject, WasmProjectCallbacks } from './types'

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

export interface PatternHelpers {
  map(value: unknown, fn: (value: any) => any): unknown
  isCssUnit(value: unknown): boolean
  isCssVar(value: unknown): boolean
  isCssFunction(value: unknown): boolean
}

export function registerCallbacks(
  project: WasmProject,
  callbacks: WasmProjectCallbacks,
  tokenDictionary: TokenDictionaryInput | undefined,
) {
  const utilityTransforms = callbacks['utility.transform']
  if (utilityTransforms && Object.keys(utilityTransforms).length > 0 && !project.registerUtilityTransform) {
    throw new Error('WASM project does not support utility.transform callbacks')
  }
  if (project.registerUtilityTransform && utilityTransforms && Object.keys(utilityTransforms).length > 0) {
    for (const [id, callback] of Object.entries(utilityTransforms)) {
      project.registerUtilityTransform(id, (value) => callback(value, createTransformArgs(value, tokenDictionary)))
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
        const nextProps = defaultValue ? mergePatternDefaultValues(defaultValue(props), props) : props
        return callback(nextProps, createPatternHelpers())
      })
    }
  }
}

export function assertProjectCallbacks(config: Record<string, unknown>, callbacks: WasmProjectCallbacks) {
  assertCallbackRefs('utility.values', getUtilityValueRefs(config), callbacks['utility.values'])
  assertCallbackRefs('utility.transform', getUtilityTransformRefs(config), callbacks['utility.transform'])
  assertCallbackRefs('pattern.transform', getPatternTransformRefs(config), callbacks['pattern.transform'])
  assertCallbackRefs('pattern.defaultValues', getPatternDefaultValueRefs(config), callbacks['pattern.defaultValues'])
}

function assertCallbackRefs(kind: string, refs: Map<string, string>, callbacks: Record<string, Function> | undefined) {
  for (const [name, id] of refs) {
    if (!callbacks?.[id]) {
      throw new Error(`Missing ${kind} callback \`${id}\` for \`${name}\``)
    }
  }
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

function createPatternHelpers(): PatternHelpers {
  return {
    map: mapPatternValue,
    isCssUnit,
    isCssVar,
    isCssFunction,
  }
}

function mapPatternValue(value: unknown, fn: (value: any) => any): unknown {
  if (Array.isArray(value)) return value.map((item) => fn(item))
  if (!isPlainObject(value)) return fn(value)
  return walkObject(value, fn)
}

function walkObject(value: Record<string, unknown>, fn: (value: any) => any): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    const next = isPlainObject(child)
      ? walkObject(child, fn)
      : Array.isArray(child)
        ? child.map((item) => fn(item))
        : fn(child)
    if (next != null) out[key] = next
  }
  return out
}

const lengthUnits =
  'cm,mm,Q,in,pc,pt,px,em,ex,ch,rem,lh,rlh,vw,vh,vmin,vmax,vb,vi,svw,svh,lvw,lvh,dvw,dvh,cqw,cqh,cqi,cqb,cqmin,cqmax,%'
const lengthUnitsPattern = `(?:${lengthUnits.split(',').join('|')})`
const lengthRegExp = new RegExp(`^[+-]?[0-9]*.?[0-9]+(?:[eE][+-]?[0-9]+)?${lengthUnitsPattern}$`)

function isCssUnit(value: unknown) {
  return typeof value === 'string' && lengthRegExp.test(value)
}

function isCssVar(value: unknown) {
  return typeof value === 'string' && /^var\(--.+\)$/.test(value)
}

function isCssFunction(value: unknown) {
  return typeof value === 'string' && /^(min|max|clamp|calc)\(.*\)/.test(value)
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

function getPatternDefaultValueRefs(config: Record<string, unknown>) {
  const refs = new Map<string, string>()
  collectPatternDefaultValueRefs(config.patterns, refs)
  return refs
}

function getPatternDefaultValueRefsByTransformId(config: Record<string, unknown>) {
  const refs = new Map<string, string>()
  const patterns = config.patterns
  if (!patterns || typeof patterns !== 'object' || Array.isArray(patterns)) return refs

  for (const pattern of Object.values(patterns as Record<string, unknown>)) {
    if (!pattern || typeof pattern !== 'object' || Array.isArray(pattern)) continue
    const transform = (pattern as Record<string, unknown>).transform
    const defaultValues = (pattern as Record<string, unknown>).defaultValues
    if (isCallbackRef(transform) && isCallbackRef(defaultValues)) {
      refs.set(transform.id, defaultValues.id)
    }
  }

  return refs
}

function collectPatternTransformRefs(value: unknown, refs: Map<string, string>) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  collectPatternTransformRefMap(value as Record<string, unknown>, refs)
}

function collectPatternTransformRefMap(patterns: Record<string, unknown>, refs: Map<string, string>) {
  for (const [name, pattern] of Object.entries(patterns)) {
    if (!pattern || typeof pattern !== 'object' || Array.isArray(pattern)) continue
    const transform = (pattern as Record<string, unknown>).transform
    if (isCallbackRef(transform)) refs.set(name, transform.id)
  }
}

function collectPatternDefaultValueRefs(value: unknown, refs: Map<string, string>) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  for (const [name, pattern] of Object.entries(value as Record<string, unknown>)) {
    if (!pattern || typeof pattern !== 'object' || Array.isArray(pattern)) continue
    const defaultValues = (pattern as Record<string, unknown>).defaultValues
    if (isCallbackRef(defaultValues)) refs.set(name, defaultValues.id)
  }
}

function mergePatternDefaultValues(defaults: unknown, props: unknown) {
  if (!isPlainObject(defaults) || !isPlainObject(props)) return props
  return { ...defaults, ...compactObject(props) }
}

function compactObject(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
