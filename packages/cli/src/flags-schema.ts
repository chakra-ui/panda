/**
 * Minimal, dependency-free stand-in for the slice of zod the CLI actually used:
 * optional boolean/string/enum/union fields on a flat object, with `.extend`/
 * `.omit`/`.pick` and a `safeParse` that reports issues shaped like zod's.
 *
 * Every flag is optional (missing/undefined always passes) — the CLI never had
 * a required flag, so that case isn't modeled.
 */

export interface Issue {
  path: [string]
  code: 'invalid_type' | 'invalid_value'
  message: string
  values?: readonly unknown[]
}

export type ParseResult<T> = { success: true; data: T } | { success: false; error: { issues: Issue[] } }

type Field =
  | { kind: 'boolean' }
  | { kind: 'string' }
  | { kind: 'stringOrNumber' }
  | { kind: 'stringOrArray' }
  | { kind: 'enum'; values: readonly string[] }

type FieldValue<F extends Field> = F extends { kind: 'boolean' }
  ? boolean
  : F extends { kind: 'string' }
    ? string
    : F extends { kind: 'stringOrNumber' }
      ? string | number
      : F extends { kind: 'stringOrArray' }
        ? string | string[]
        : F extends { kind: 'enum'; values: infer V }
          ? V extends readonly (infer U)[]
            ? U
            : never
          : never

export type Shape = Record<string, Field>
type Infer<S extends Shape> = { [K in keyof S]?: FieldValue<S[K]> }

// Each builder returns its own literal `kind`, not the widened `Field` union —
// otherwise `FieldValue<S[key]>` distributes over every variant instead of the
// one actually assigned to that key, and every flag's inferred type collapses
// to `string | number | boolean | string[]`.
export function bool(): { kind: 'boolean' } {
  return { kind: 'boolean' }
}

export function str(): { kind: 'string' } {
  return { kind: 'string' }
}

export function stringOrNumber(): { kind: 'stringOrNumber' } {
  return { kind: 'stringOrNumber' }
}

export function stringOrArray(): { kind: 'stringOrArray' } {
  return { kind: 'stringOrArray' }
}

export function enumOf<const V extends readonly string[]>(values: V): { kind: 'enum'; values: V } {
  return { kind: 'enum', values }
}

export type EnumValues<F> = F extends { kind: 'enum'; values: infer V }
  ? V extends readonly (infer U)[]
    ? U
    : never
  : never

function typeLabel(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function parseField(field: Field, value: unknown): { ok: true; value: unknown } | { ok: false; message: string } {
  switch (field.kind) {
    case 'boolean':
      return typeof value === 'boolean'
        ? { ok: true, value }
        : { ok: false, message: `expected boolean, received ${typeLabel(value)}` }
    case 'string':
      return typeof value === 'string'
        ? { ok: true, value }
        : { ok: false, message: `expected string, received ${typeLabel(value)}` }
    case 'stringOrNumber': {
      const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
      return Number.isFinite(numeric) ? { ok: true, value } : { ok: false, message: 'expected a number' }
    }
    case 'stringOrArray':
      return typeof value === 'string' || (Array.isArray(value) && value.every((entry) => typeof entry === 'string'))
        ? { ok: true, value }
        : { ok: false, message: `expected string or array of strings, received ${typeLabel(value)}` }
    case 'enum':
      return field.values.includes(value as string)
        ? { ok: true, value }
        : { ok: false, message: `invalid value, received ${typeLabel(value)}` }
  }
}

export class FlagsSchema<S extends Shape> {
  constructor(readonly shape: S) {}

  extend<S2 extends Shape>(shape: S2): FlagsSchema<Omit<S, keyof S2> & S2> {
    return new FlagsSchema({ ...this.shape, ...shape } as Omit<S, keyof S2> & S2)
  }

  omit<K extends keyof S>(keys: Record<K, true>): FlagsSchema<Omit<S, K>> {
    const next = { ...this.shape }
    for (const key of Object.keys(keys)) delete next[key]
    return new FlagsSchema(next as Omit<S, K>)
  }

  pick<K extends keyof S>(keys: Record<K, true>): FlagsSchema<Pick<S, K>> {
    const next = {} as Pick<S, K>
    for (const key of Object.keys(keys) as K[]) next[key] = this.shape[key] as Pick<S, K>[K]
    return new FlagsSchema(next)
  }

  safeParse(input: unknown): ParseResult<Infer<S>> {
    const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
    const data: Record<string, unknown> = {}
    const issues: Issue[] = []

    for (const key of Object.keys(this.shape)) {
      const value = source[key]
      if (value === undefined) continue

      const field = this.shape[key]
      const result = parseField(field, value)
      if (result.ok) {
        data[key] = result.value
      } else if (field.kind === 'enum') {
        issues.push({ path: [key], code: 'invalid_value', message: result.message, values: field.values })
      } else {
        issues.push({ path: [key], code: 'invalid_type', message: result.message })
      }
    }

    if (issues.length > 0) return { success: false, error: { issues } }
    return { success: true, data: data as Infer<S> }
  }
}

export function object<S extends Shape>(shape: S): FlagsSchema<S> {
  return new FlagsSchema(shape)
}

export type FlagsInfer<T extends FlagsSchema<Shape>> = T extends FlagsSchema<infer S> ? Infer<S> : never
