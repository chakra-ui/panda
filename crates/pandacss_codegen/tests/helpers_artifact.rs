mod common;

use common::{artifact, file, paths};
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions, ModuleSpecifierPolicy};
use pandacss_config::CodegenFormat;

const EXPECTED_TS: &str = r#"
export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v != null && !Array.isArray(v)
}

const HAS_OWN = Object.prototype.hasOwnProperty

export function isBaseCondition(v: string): boolean {
  return v === "base"
}

export function filterBaseConditions(c: string[]): string[] {
  const out = []
  for (let i = 0; i < c.length; i++) {
    if (!isBaseCondition(c[i])) out.push(c[i])
  }
  return out
}

export function toHash(v: string): string {
  let h = 5381
  for (let i = v.length; i; ) h = (h * 33) ^ v.charCodeAt(--i)
  let x = h >>> 0, out = ''
  for (; x > 52; x = (x / 52) | 0) {
    const c = x % 52
    out = String.fromCharCode(c + (c > 25 ? 39 : 97)) + out
  }
  const c = x % 52
  return String.fromCharCode(c + (c > 25 ? 39 : 97)) + out
}

export function compact<T extends Record<string, unknown>>(v: T): Partial<T> {
  const out = Object.create(null)
  if (!v) return out
  for (const k in v) {
    if (v[k] !== void 0) out[k] = v[k]
  }
  return out
}

export function toResponsiveObject(values: any[], breakpoints: string[]): Record<string, any> {
  const out = Object.create(null)
  for (let i = 0; i < values.length; i++) {
    if (values[i] != null) out[breakpoints[i]] = values[i]
  }
  return out
}

export function walkObject(target: unknown, fn: (value: any, path: string[]) => any, options?: Record<string, any>): any {
  options ||= {}
  const { stop, getKey } = options
  const inner = (value: any, path: string[] = []) => {
    if (!value || typeof value !== "object") return fn(value, path)
    if (stop?.(value, path)) return fn(value, path)
    const out: any = Array.isArray(value) ? [] : Object.create(null)
    for (const prop in value) {
      if (!HAS_OWN.call(value, prop)) continue
      const key = getKey?.(prop, value[prop]) ?? prop
      path.push(key)
      const next = inner(value[prop], path)
      path.pop()
      if (next != null) out[key] = next
    }
    return out
  }
  return inner(target)
}

export function mapObject(obj: unknown, fn: (value: any) => any): any {
  return Array.isArray(obj) ? obj.map(fn) : isObject(obj) ? walkObject(obj, fn) : fn(obj)
}

export function normalizeStyleObject(styles: Record<string, any>, context: Record<string, any>, shorthand?: boolean): Record<string, any> {
  const { utility, conditions } = context
  const { hasShorthand, resolveShorthand } = utility
  shorthand = shorthand !== false
  return walkObject(styles, (value: any) => Array.isArray(value) ? toResponsiveObject(value, conditions.breakpoints.keys) : value, {
    stop: Array.isArray,
    getKey: shorthand ? (prop: string) => hasShorthand ? resolveShorthand(prop) : prop : void 0
  })
}

export function memo<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const out = fn(...args)
    cache.set(key, out)
    return out
  }) as T
}

export function mergeProps(...src: Array<Record<string, any> | undefined>): Record<string, any> {
  const out = Object.create(null)
  for (const obj of src) {
    if (!obj) continue
    for (const k in obj) {
      if (!HAS_OWN.call(obj, k) || k === "__proto__" || k === "constructor" || k === "prototype") continue
      const prev = out[k]
      const next = obj[k]
      out[k] = isObject(prev) && isObject(next) ? mergeProps(prev, next) : next
    }
  }
  return out
}

export function createCss(context: Record<string, any>): (...styles: any[]) => string {
  const { utility: u, hash, conditions: c = { shift: (v: any) => v, finalize: (v: any[]) => v, breakpoints: { keys: [] } } } = context
  const fmt = (s: string) => u.prefix ? u.prefix + "-" + s : s
  const toClass = (paths: string[], name: string) => {
    const parts = c.finalize(paths)
    parts.push(hash ? name : fmt(name))
    return hash ? fmt(u.toHash(parts, toHash)) : parts.join(":")
  }
  return memo(({ base, ...styles }: Record<string, any> = {}) => {
    const obj = mapObject(base ? Object.assign(styles, base) : styles, (v: any) => Array.isArray(v) ? toResponsiveObject(v, c.breakpoints.keys) : v)
    const set = new Set<string>()
    walkObject(obj, (value: any, paths: string[]) => {
      if (value == null) return
      const [prop, ...all] = c.shift(paths)
      const cond = filterBaseConditions(all)
      const res = u.transform(prop, withoutSpace(value))
      set.add(toClass(cond, res.className))
    })
    let out = ""
    for (const name of set) out += out ? " " + name : name
    return out
  })
}

export function createMergeCss(context: Record<string, any>): { mergeCss: (...styles: any[]) => any; assignCss: (...styles: any[]) => any } {
  const resolve = (styles: Array<any> | IArguments) => {
    const out: any[] = []
    const visit = (items: Array<any> | IArguments) => {
      for (let i = 0; i < items.length; i++) {
        const style = items[i]
        if (Array.isArray(style)) {
          visit(style)
          continue
        }
        if (!isObject(style)) continue
        for (const key in style) {
          if (style[key] !== void 0) {
            out.push(style)
            break
          }
        }
      }
    }
    visit(styles)
    if (out.length < 2) return out
    for (let i = 0; i < out.length; i++) out[i] = normalizeStyleObject(out[i], context)
    return out
  }
  const mergeCss: (...styles: any[]) => any = function() {
    return mergeProps(...resolve(arguments))
  }
  const assignCss: (...styles: any[]) => any = function() {
    const out: Record<string, any> = {}
    const resolved = resolve(arguments)
    for (let i = 0; i < resolved.length; i++) Object.assign(out, resolved[i])
    return out
  }
  return { mergeCss: memo(mergeCss), assignCss }
}

export function hypenateProperty(property: string): string {
  return property.startsWith("--") ? property : property.replace(/[A-Z]/g, "-$&").replace(/^ms-/, "-ms-").toLowerCase()
}

export function isCssFunction(v: unknown): boolean {
  return typeof v === "string" && /^(min|max|clamp|calc)\(.*\)/.test(v)
}

export function isCssVar(v: unknown): boolean {
  return typeof v === "string" && /^var\(--.+\)$/.test(v)
}

export function isCssUnit(v: unknown): boolean {
  return typeof v === "string" && /^[+-]?[0-9]*.?[0-9]+(?:[eE][+-]?[0-9]+)?(?:cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|rlh|vw|vh|vmin|vmax|vb|vi|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|%)$/.test(v)
}

export const patternFns: Record<string, (...args: any[]) => any> = { map: mapObject, isCssFunction, isCssVar, isCssUnit }

export function getPatternStyles(pattern: Record<string, any>, styles: Record<string, any>): Record<string, any> {
  if (!pattern?.defaultValues) return styles
  const defaults = typeof pattern.defaultValues === "function" ? pattern.defaultValues(styles) : pattern.defaultValues
  const out = Object.assign({}, defaults)
  for (const key in styles) {
    if (styles[key] !== void 0) out[key] = styles[key]
  }
  return out
}

export function getSlotRecipes(recipe?: Record<string, any>): Record<string, any> {
  recipe ||= {}
  const out = Object.create(null)
  const slots = recipe.slots ?? []
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    out[slot] = {
      className: recipe.className ? recipe.className + "__" + slot : slot,
      base: recipe.base?.[slot] ?? {},
      variants: {},
      defaultVariants: recipe.defaultVariants ?? {},
      compoundVariants: recipe.compoundVariants ? getSlotCompoundVariant(recipe.compoundVariants, slot) : []
    }
  }
  for (const variantsKey in recipe.variants ?? {}) {
    const variants = recipe.variants[variantsKey]
    for (const variantKey in variants) {
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        out[slot].variants[variantsKey] ??= {}
        out[slot].variants[variantsKey][variantKey] = variants[variantKey][slot] ?? {}
      }
    }
  }
  return out
}

export function getSlotCompoundVariant(compoundVariants: Array<Record<string, any>>, slot: string): Array<Record<string, any>> {
  const out: Array<Record<string, any>> = []
  if (!compoundVariants) return out
  for (let i = 0; i < compoundVariants.length; i++) {
    const cv = compoundVariants[i]
    if (cv.css?.[slot]) out.push({ ...cv, css: cv.css[slot] })
  }
  return out
}

export function splitProps<T extends Record<string, any>>(props: T, ...keys: Array<Array<keyof T> | ((key: keyof T) => boolean)>): any[] {
  const desc = Object.getOwnPropertyDescriptors(props)
  const all = Object.keys(desc)
  const split = (ks: string[]) => {
    const out: Record<string, any> = Object.create(null)
    for (let i = 0; i < ks.length; i++) {
      const k = ks[i]
      if (desc[k]) {
        Object.defineProperty(out, k, desc[k])
        delete desc[k]
      }
    }
    return out
  }
  const out: any[] = []
  for (const key of keys) {
    if (Array.isArray(key)) {
      out.push(split(key as string[]))
      continue
    }
    const picked: string[] = []
    for (let i = 0; i < all.length; i++) {
      if (key(all[i])) picked.push(all[i])
    }
    out.push(split(picked))
  }
  out.push(split(all))
  return out
}

export function uniq<T>(...items: Array<T[] | undefined>): T[] {
  const set = new Set<T>()
  for (const values of items) {
    if (!values) continue
    for (let i = 0; i < values.length; i++) set.add(values[i])
  }
  return Array.from(set)
}

export function withoutSpace<T extends string | number | boolean>(str: T): T {
  return (typeof str === "string" && str.indexOf(" ") >= 0 ? str.replaceAll(" ", "_") : str) as T
}
"#;

const EXPECTED_JS: &str = r#"
export function isObject(v) {
  return typeof v === "object" && v != null && !Array.isArray(v)
}

const HAS_OWN = Object.prototype.hasOwnProperty

export function isBaseCondition(v) {
  return v === "base"
}

export function filterBaseConditions(c) {
  const out = []
  for (let i = 0; i < c.length; i++) {
    if (!isBaseCondition(c[i])) out.push(c[i])
  }
  return out
}

export function toHash(v) {
  let h = 5381
  for (let i = v.length; i; ) h = (h * 33) ^ v.charCodeAt(--i)
  let x = h >>> 0, out = ''
  for (; x > 52; x = (x / 52) | 0) {
    const c = x % 52
    out = String.fromCharCode(c + (c > 25 ? 39 : 97)) + out
  }
  const c = x % 52
  return String.fromCharCode(c + (c > 25 ? 39 : 97)) + out
}

export function compact(v) {
  const out = Object.create(null)
  if (!v) return out
  for (const k in v) {
    if (v[k] !== void 0) out[k] = v[k]
  }
  return out
}

export function toResponsiveObject(values, breakpoints) {
  const out = Object.create(null)
  for (let i = 0; i < values.length; i++) {
    if (values[i] != null) out[breakpoints[i]] = values[i]
  }
  return out
}

export function walkObject(target, fn, options) {
  options ||= {}
  const { stop, getKey } = options
  const inner = (value, path = []) => {
    if (!value || typeof value !== "object") return fn(value, path)
    if (stop?.(value, path)) return fn(value, path)
    const out = Array.isArray(value) ? [] : Object.create(null)
    for (const prop in value) {
      if (!HAS_OWN.call(value, prop)) continue
      const key = getKey?.(prop, value[prop]) ?? prop
      path.push(key)
      const next = inner(value[prop], path)
      path.pop()
      if (next != null) out[key] = next
    }
    return out
  }
  return inner(target)
}

export function mapObject(obj, fn) {
  return Array.isArray(obj) ? obj.map(fn) : isObject(obj) ? walkObject(obj, fn) : fn(obj)
}

export function normalizeStyleObject(styles, context, shorthand) {
  const { utility, conditions } = context
  const { hasShorthand, resolveShorthand } = utility
  shorthand = shorthand !== false
  return walkObject(styles, (value) => Array.isArray(value) ? toResponsiveObject(value, conditions.breakpoints.keys) : value, {
    stop: Array.isArray,
    getKey: shorthand ? (prop) => hasShorthand ? resolveShorthand(prop) : prop : void 0
  })
}

export function memo(fn) {
  const cache = new Map()
  return ((...args) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const out = fn(...args)
    cache.set(key, out)
    return out
  })
}

export function mergeProps(...src) {
  const out = Object.create(null)
  for (const obj of src) {
    if (!obj) continue
    for (const k in obj) {
      if (!HAS_OWN.call(obj, k) || k === "__proto__" || k === "constructor" || k === "prototype") continue
      const prev = out[k]
      const next = obj[k]
      out[k] = isObject(prev) && isObject(next) ? mergeProps(prev, next) : next
    }
  }
  return out
}

export function createCss(context) {
  const { utility: u, hash, conditions: c = { shift: (v) => v, finalize: (v) => v, breakpoints: { keys: [] } } } = context
  const fmt = (s) => u.prefix ? u.prefix + "-" + s : s
  const toClass = (paths, name) => {
    const parts = c.finalize(paths)
    parts.push(hash ? name : fmt(name))
    return hash ? fmt(u.toHash(parts, toHash)) : parts.join(":")
  }
  return memo(({ base, ...styles } = {}) => {
    const obj = mapObject(base ? Object.assign(styles, base) : styles, (v) => Array.isArray(v) ? toResponsiveObject(v, c.breakpoints.keys) : v)
    const set = new Set()
    walkObject(obj, (value, paths) => {
      if (value == null) return
      const [prop, ...all] = c.shift(paths)
      const cond = filterBaseConditions(all)
      const res = u.transform(prop, withoutSpace(value))
      set.add(toClass(cond, res.className))
    })
    let out = ""
    for (const name of set) out += out ? " " + name : name
    return out
  })
}

export function createMergeCss(context) {
  const resolve = (styles) => {
    const out = []
    const visit = (items) => {
      for (let i = 0; i < items.length; i++) {
        const style = items[i]
        if (Array.isArray(style)) {
          visit(style)
          continue
        }
        if (!isObject(style)) continue
        for (const key in style) {
          if (style[key] !== void 0) {
            out.push(style)
            break
          }
        }
      }
    }
    visit(styles)
    if (out.length < 2) return out
    for (let i = 0; i < out.length; i++) out[i] = normalizeStyleObject(out[i], context)
    return out
  }
  const mergeCss = function() {
    return mergeProps(...resolve(arguments))
  }
  const assignCss = function() {
    const out = {}
    const resolved = resolve(arguments)
    for (let i = 0; i < resolved.length; i++) Object.assign(out, resolved[i])
    return out
  }
  return { mergeCss: memo(mergeCss), assignCss }
}

export function hypenateProperty(property) {
  return property.startsWith("--") ? property : property.replace(/[A-Z]/g, "-$&").replace(/^ms-/, "-ms-").toLowerCase()
}

export function isCssFunction(v) {
  return typeof v === "string" && /^(min|max|clamp|calc)\(.*\)/.test(v)
}

export function isCssVar(v) {
  return typeof v === "string" && /^var\(--.+\)$/.test(v)
}

export function isCssUnit(v) {
  return typeof v === "string" && /^[+-]?[0-9]*.?[0-9]+(?:[eE][+-]?[0-9]+)?(?:cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|rlh|vw|vh|vmin|vmax|vb|vi|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|%)$/.test(v)
}

export const patternFns = { map: mapObject, isCssFunction, isCssVar, isCssUnit }

export function getPatternStyles(pattern, styles) {
  if (!pattern?.defaultValues) return styles
  const defaults = typeof pattern.defaultValues === "function" ? pattern.defaultValues(styles) : pattern.defaultValues
  const out = Object.assign({}, defaults)
  for (const key in styles) {
    if (styles[key] !== void 0) out[key] = styles[key]
  }
  return out
}

export function getSlotRecipes(recipe) {
  recipe ||= {}
  const out = Object.create(null)
  const slots = recipe.slots ?? []
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    out[slot] = {
      className: recipe.className ? recipe.className + "__" + slot : slot,
      base: recipe.base?.[slot] ?? {},
      variants: {},
      defaultVariants: recipe.defaultVariants ?? {},
      compoundVariants: recipe.compoundVariants ? getSlotCompoundVariant(recipe.compoundVariants, slot) : []
    }
  }
  for (const variantsKey in recipe.variants ?? {}) {
    const variants = recipe.variants[variantsKey]
    for (const variantKey in variants) {
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        out[slot].variants[variantsKey] ??= {}
        out[slot].variants[variantsKey][variantKey] = variants[variantKey][slot] ?? {}
      }
    }
  }
  return out
}

export function getSlotCompoundVariant(compoundVariants, slot) {
  const out = []
  if (!compoundVariants) return out
  for (let i = 0; i < compoundVariants.length; i++) {
    const cv = compoundVariants[i]
    if (cv.css?.[slot]) out.push({ ...cv, css: cv.css[slot] })
  }
  return out
}

export function splitProps(props, ...keys) {
  const desc = Object.getOwnPropertyDescriptors(props)
  const all = Object.keys(desc)
  const split = (ks) => {
    const out = Object.create(null)
    for (let i = 0; i < ks.length; i++) {
      const k = ks[i]
      if (desc[k]) {
        Object.defineProperty(out, k, desc[k])
        delete desc[k]
      }
    }
    return out
  }
  const out = []
  for (const key of keys) {
    if (Array.isArray(key)) {
      out.push(split(key))
      continue
    }
    const picked = []
    for (let i = 0; i < all.length; i++) {
      if (key(all[i])) picked.push(all[i])
    }
    out.push(split(picked))
  }
  out.push(split(all))
  return out
}

export function uniq(...items) {
  const set = new Set()
  for (const values of items) {
    if (!values) continue
    for (let i = 0; i < values.length; i++) set.add(values[i])
  }
  return Array.from(set)
}

export function withoutSpace(str) {
  return (typeof str === "string" && str.indexOf(" ") >= 0 ? str.replaceAll(" ", "_") : str)
}
"#;

const EXPECTED_DTS: &str = r"
export declare function isObject(v: unknown): v is Record<string, unknown>;

export declare function isBaseCondition(v: string): boolean;

export declare function filterBaseConditions(c: string[]): string[];

export declare function toHash(v: string): string;

export declare function compact<T extends Record<string, unknown>>(v: T): Partial<T>;

export declare function toResponsiveObject(values: any[], breakpoints: string[]): Record<string, any>;

export declare function walkObject(target: unknown, fn: (value: any, path: string[]) => any, options?: Record<string, any>): any;

export declare function mapObject(obj: unknown, fn: (value: any) => any): any;

export declare function normalizeStyleObject(styles: Record<string, any>, context: Record<string, any>, shorthand?: boolean): Record<string, any>;

export declare function memo<T extends (...args: any[]) => any>(fn: T): T;

export declare function mergeProps(...src: Array<Record<string, any> | undefined>): Record<string, any>;

export declare function createCss(context: Record<string, any>): (...styles: any[]) => string;

export declare function createMergeCss(context: Record<string, any>): { mergeCss: (...styles: any[]) => any; assignCss: (...styles: any[]) => any };

export declare function hypenateProperty(property: string): string;

export declare function isCssFunction(v: unknown): boolean;

export declare function isCssVar(v: unknown): boolean;

export declare function isCssUnit(v: unknown): boolean;

export declare const patternFns: Record<string, (...args: any[]) => any>;

export declare function getPatternStyles(pattern: Record<string, any>, styles: Record<string, any>): Record<string, any>;

export declare function getSlotRecipes(recipe?: Record<string, any>): Record<string, any>;

export declare function getSlotCompoundVariant(compoundVariants: Array<Record<string, any>>, slot: string): Array<Record<string, any>>;

export declare function splitProps<T extends Record<string, any>>(props: T, ...keys: Array<Array<keyof T> | ((key: keyof T) => boolean)>): any[];

export declare function uniq<T>(...items: Array<T[] | undefined>): T[];

export declare function withoutSpace<T extends string | number | boolean>(str: T): T;
";

#[test]
fn emits_ts_source() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        specifiers: ModuleSpecifierPolicy::Extensionless,
    });
    let helpers = artifact(&artifacts, ArtifactId::Helpers);

    assert_eq!(paths(helpers), vec!["helpers.ts"]);
    assert_eq!(file(helpers, "helpers.ts"), EXPECTED_TS.trim());
}

#[test]
fn emits_js_runtime() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate(GenerateOptions {
        format: CodegenFormat::Js,
        specifiers: ModuleSpecifierPolicy::Extensionless,
    });
    let helpers = artifact(&artifacts, ArtifactId::Helpers);

    assert_eq!(paths(helpers), vec!["helpers.js", "helpers.d.ts"]);
    assert_eq!(file(helpers, "helpers.js"), EXPECTED_JS.trim());
}

#[test]
fn emits_declarations() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate(GenerateOptions {
        format: CodegenFormat::Js,
        specifiers: ModuleSpecifierPolicy::Extensionless,
    });
    let helpers = artifact(&artifacts, ArtifactId::Helpers);

    assert_eq!(paths(helpers), vec!["helpers.js", "helpers.d.ts"]);
    assert_eq!(file(helpers, "helpers.d.ts"), EXPECTED_DTS.trim());
}
