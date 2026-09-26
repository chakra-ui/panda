use crate::common::{artifact, file, paths, user_config};
use insta::assert_snapshot;
use pandacss_codegen::{Artifact, ArtifactGraph, ArtifactId, CodegenContext, GenerateOptions};
use pandacss_config::CodegenFormat;
use pandacss_config::UserConfig;

fn generate_helpers(config: &UserConfig, format: CodegenFormat) -> Artifact {
    let artifacts = ArtifactGraph.generate_all(
        CodegenContext::config_only(config),
        GenerateOptions {
            format,
            import_extensions: false,
        },
    );
    artifact(&artifacts, ArtifactId::Helpers).clone()
}

fn function_block(source: &str, name: &str) -> String {
    let needle = format!("export function {name}");
    let start = source.find(&needle).expect("function should exist");
    let rest = &source[start..];
    let end = rest
        .find("\n\nexport function ")
        .or_else(|| rest.find("\n\nexport const "))
        .unwrap_or(rest.len());
    rest[..end].to_owned()
}

fn declaration_lines(source: &str) -> String {
    source
        .lines()
        .filter(|line| line.contains("function create") || line.contains("resolveStyleArgs"))
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "large generated helper snapshots are easier to review as one test"
)]
fn ts_helpers_include_memo_and_style_serializer() {
    let helpers = generate_helpers(&UserConfig::default(), CodegenFormat::Ts);

    assert_eq!(paths(&helpers), vec!["helpers.ts"]);
    let source = file(&helpers, "helpers.ts");
    assert!(
        source.contains(
            "const WHITESPACE_REGEX = /[\\n\\s]+/g\nconst sanitizeStyleValue = (value: any)"
        ),
        "multiline value sanitizer should reuse a module-scope regex"
    );
    assert_snapshot!(function_block(source, "memo"), @r#"
    export function memo<T extends (...args: any[]) => any>(fn: T): T {
      const cache = new Map<number, Array<{ args: Parameters<T>; out: ReturnType<T> }>>()
      const stringCache = new Map<string, ReturnType<T>>()
      const seen = new WeakSet<object>()
      const newNode = (): any => ({ objects: new WeakMap(), prims: new Map(), out: void 0, has: false })
      const root = newNode()
      let lastHash: number | undefined
      let lastKey: Parameters<T> | string | undefined
      let lastValue: ReturnType<T>
      let hasLast = false
      let misses = 0

      const step = (node: any, v: any) => {
        if (v !== null && typeof v === "object") {
          let next = node.objects.get(v)
          if (next === void 0) { next = newNode(); node.objects.set(v, next) }
          return next
        }
        let next = node.prims.get(v)
        if (next === void 0) {
          if (node.prims.size > 64) node.prims.clear()
          next = newNode()
          node.prims.set(v, next)
        }
        return next
      }
      const walk = (node: any, v: any): any => {
        if (Array.isArray(v)) {
          node = step(node, "\u0000[")
          for (let i = 0; i < v.length; i++) node = walk(node, v[i])
          return step(node, "\u0000]")
        }
        return step(node, v)
      }
      const readWalk = (node: any, v: any): any => {
        if (node === void 0) return void 0
        if (Array.isArray(v)) {
          node = node.prims.get("\u0000[")
          for (let i = 0; i < v.length && node !== void 0; i++) node = readWalk(node, v[i])
          return node === void 0 ? void 0 : node.prims.get("\u0000]")
        }
        return v !== null && typeof v === "object" ? node.objects.get(v) : node.prims.get(v)
      }
      const markSeen = (v: any): boolean => {
        if (Array.isArray(v)) {
          let all = true
          for (let i = 0; i < v.length; i++) if (!markSeen(v[i])) all = false
          return all
        }
        if (v === null || typeof v !== "object") return true
        if (seen.has(v)) return true
        seen.add(v)
        return false
      }

      return ((...args: Parameters<T>) => {
        let composed = false
        for (let i = 0; i < args.length; i++) if (Array.isArray(args[i])) { composed = true; break }

        if (composed) {
          let node = root
          for (let i = 0; i < args.length && node !== void 0; i++) node = readWalk(node, args[i])
          if (node !== void 0 && node.has) return node.out

          const composedKey = JSON.stringify(args)
          let composedOut =
            hasLast && lastHash === void 0 && composedKey === lastKey ? lastValue : stringCache.get(composedKey)
          if (composedOut === void 0) {
            composedOut = fn(...args)
            stringCache.set(composedKey, composedOut)
            if (stringCache.size > 500) stringCache.delete(stringCache.keys().next().value as string)
          }

          let reused = false
          if ((++misses & 3) === 0) {
            reused = true
            for (let i = 0; i < args.length; i++) if (!markSeen(args[i])) reused = false
          }
          if (reused) {
            let insert = root
            for (let i = 0; i < args.length; i++) insert = walk(insert, args[i])
            insert.out = composedOut
            insert.has = true
          }
          lastHash = void 0
          lastKey = composedKey
          lastValue = composedOut
          hasLast = true
          return composedOut
        }

        const hash = flatHashOrNull(args)
        if (hash !== null) {
          if (hasLast && lastHash === hash && flatArgsEqual(args, lastKey as Parameters<T>)) return lastValue
          let bucket = cache.get(hash)
          if (bucket) {
            for (let i = 0; i < bucket.length; i++) {
              if (flatArgsEqual(args, bucket[i].args)) {
                lastHash = hash
                lastKey = args
                lastValue = bucket[i].out
                hasLast = true
                return bucket[i].out
              }
            }
          }
          const out = fn(...args)
          if (!bucket) {
            bucket = []
            cache.set(hash, bucket)
          }
          bucket.push({ args, out })
          if (bucket.length > 8) bucket.shift()
          if (cache.size > 500) cache.delete(cache.keys().next().value as number)
          lastHash = hash
          lastKey = args
          lastValue = out
          hasLast = true
          return out
        }

        const key = JSON.stringify(args)
        if (hasLast && lastHash === void 0 && key === lastKey) return lastValue
        const cached = stringCache.get(key)
        if (cached !== void 0) {
          lastHash = void 0
          lastKey = key
          lastValue = cached
          hasLast = true
          return cached
        }
        const out = fn(...args)
        stringCache.set(key, out)
        if (stringCache.size > 500) stringCache.delete(stringCache.keys().next().value as string)
        lastHash = void 0
        lastKey = key
        lastValue = out
        hasLast = true
        return out
      }) as T
    }
    "#);
    assert_snapshot!(function_block(source, "weakMemo"), @r#"
    export function weakMemo<T extends (arg: any) => any>(fn: T): T {
      const cache: WeakMap<object, ReturnType<T>> = new WeakMap()
      return ((arg: Parameters<T>[0]) => {
        if (!arg || typeof arg !== "object") return fn(arg)
        if (cache.has(arg)) return cache.get(arg) as ReturnType<T>
        const out = fn(arg)
        cache.set(arg, out)
        return out
      }) as T
    }
    "#);
    assert_snapshot!(function_block(source, "createSerializeCss"), @r#"
    export function createSerializeCss(context: Record<string, any>): (...styles: any[]) => string {
      const u = context.utility
      const c = context.conditions
      const hash = context.hash
      const fmt = (s: string) => u.prefix ? u.prefix + "-" + s : s
      const toClass = (paths: string[], name: string) => {
        const parts = c.finalize(paths)
        parts.push(hash ? name : fmt(name))
        return hash ? fmt(u.toHash(parts, toHash)) : parts.join(":")
      }
      return weakMemo(memo(function serializeCss({ base, ...styles }: Record<string, any> = {}) {
        const obj = normalizeStyleObject(base ? Object.assign(styles, base) : styles, context)
        const set = new Set<string>()
        walkObject(obj, (value: any, paths: string[]) => {
          if (value == null) return
          const important = isImportant(value)
          const [prop, ...all] = c.shift(paths)
          const cond = filterBaseConditions(all)
          const res = u.transform(prop, withoutSpace(withoutImportant(sanitizeStyleValue(value))))
          let name = toClass(cond, res.className)
          if (important) name += "!"
          set.add(name)
        })
        let out = ""
        for (const name of set) out += out ? " " + name : name
        return out
      }))
    }
    "#);
}

#[test]
fn css_var_prefix_is_used_by_to_css_var_and_color_mix() {
    let helpers = generate_helpers(
        &user_config(serde_json::json!({ "prefix": { "cssVar": "pd" } })),
        CodegenFormat::Ts,
    );
    let source = file(&helpers, "helpers.ts");
    assert_snapshot!(function_block(source, "toCssVar"), @r#"
    export function toCssVar(path: string): string {
      let out = ""
      for (const ch of path.replaceAll(".", "-")) {
        if (ch >= "A" && ch <= "Z") out += "-" + ch.toLowerCase()
        else if (/[a-z0-9_-]/.test(ch) || ch >= "\u0081") out += ch
        else out += "\\" + ch
      }
      return "var(--pd-" + out + ")"
    }
    "#);
    assert_snapshot!(function_block(source, "colorMix"), @r#"
    export function colorMix(tokens: Record<string, string>, path: string): string | undefined {
      const colorPrefix = "colors."
      if (!path.startsWith(colorPrefix)) return

      const index = path.indexOf("/", colorPrefix.length)
      if (index === -1 || index === path.length - 1) return

      const colorPath = path.slice(0, index)
      if (tokens[colorPath] === undefined) return

      const rawOpacity = path.slice(index + 1)
      const opacity = tokens["opacity." + rawOpacity]
      const percent = opacity === undefined ? Number(rawOpacity) : Number(opacity) * 100
      if (Number.isNaN(percent)) return

      return "color-mix(in oklab, " + toCssVar(colorPath) + " " + percent + "%, transparent)"
    }
    "#);
}

#[test]
fn emits_ts_with_defaults() {
    let helpers = generate_helpers(&UserConfig::default(), CodegenFormat::Ts);

    let source = file(&helpers, "helpers.ts");
    assert_snapshot!(function_block(source, "withDefaults"), @"
    export function withDefaults(defaults: Record<string, any>, props: Record<string, any>): Record<string, any> {
      return { ...defaults, ...compact(props) }
    }
    ");
}

#[test]
fn emits_js_with_defaults() {
    let helpers = generate_helpers(&UserConfig::default(), CodegenFormat::Js);

    let source = file(&helpers, "helpers.js");
    assert_snapshot!(function_block(source, "withDefaults"), @"
    export function withDefaults(defaults, props) {
      return { ...defaults, ...compact(props) }
    }
    ");
}

#[test]
fn emits_js_get_compound_variant_css() {
    let helpers = generate_helpers(&UserConfig::default(), CodegenFormat::Js);

    let source = file(&helpers, "helpers.js");
    assert_snapshot!(function_block(source, "getCompoundVariantCss"), @r#"
    export function getCompoundVariantCss(compoundVariants, variants) {
      let result = {}
      for (const variant of compoundVariants) {
        if (!compoundVariantMatches(variant, variants)) continue
        result = mergeProps(result, variant.css)
      }
      return result
    }
    "#);
}

#[test]
fn emits_js_get_compound_variant_class_names() {
    let helpers = generate_helpers(&UserConfig::default(), CodegenFormat::Js);

    let source = file(&helpers, "helpers.js");
    assert_snapshot!(function_block(source, "getCompoundVariantClassNames"), @r#"
    export function getCompoundVariantClassNames(compoundVariants, variants, formatClassName) {
      const classes = []
      for (const compound of compoundVariants) {
        if (!compoundVariantMatches(compound, variants)) continue
        if (compound.className) classes.push(formatClassName ? formatClassName(compound.className) : compound.className)
      }
      return classes.join(" ")
    }
    "#);
}

#[test]
fn emits_js_get_slot_compound_variant() {
    let helpers = generate_helpers(&UserConfig::default(), CodegenFormat::Js);

    let source = file(&helpers, "helpers.js");
    assert_snapshot!(function_block(source, "getSlotCompoundVariant"), @r#"
    export function getSlotCompoundVariant(compoundVariants, slot) {
      const result = []
      for (const variant of compoundVariants) {
        const css = variant.css?.[slot]
        const className = variant.classNames?.[slot] ?? variant.className
        if (!css && !className) continue
        const next = css ? { css } : {}
        for (const key in variant) {
          if (key === "css" || key === "className" || key === "classNames") continue
          next[key] = variant[key]
        }
        if (className) next.className = className
        result.push(next)
      }
      return result
    }
    "#);
}

#[test]
fn emits_js_get_slot_recipes() {
    let helpers = generate_helpers(&UserConfig::default(), CodegenFormat::Js);

    let source = file(&helpers, "helpers.js");
    assert_snapshot!(function_block(source, "getSlotRecipes"), @r#"
    export function getSlotRecipes(recipe) {
      const result = {}
      const slots = recipe.slots ?? []
      for (const slot of slots) {
        result[slot] = {
          className: recipe.className ? recipe.className + "__" + slot : slot,
          base: recipe.base?.[slot] ?? {},
          variants: {},
          defaultVariants: recipe.defaultVariants ?? {},
          compoundVariants: getSlotCompoundVariant(recipe.compoundVariants ?? [], slot),
        }
      }
      const variants = recipe.variants ?? {}
      for (const variantsKey in variants) {
        const variantGroup = variants[variantsKey]
        for (const slot of slots) {
          const group = result[slot].variants[variantsKey] = {}
          for (const variantKey in variantGroup) {
            group[variantKey] = variantGroup[variantKey][slot] ?? {}
          }
        }
      }
      return result
    }
    "#);
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "large generated helper snapshots are easier to review as one test"
)]
fn js_helpers_include_memo_and_style_serializer() {
    let helpers = generate_helpers(&UserConfig::default(), CodegenFormat::Js);

    assert_eq!(paths(&helpers), vec!["helpers.js", "helpers.d.ts"]);
    let source = file(&helpers, "helpers.js");
    assert!(
        source
            .contains("const WHITESPACE_REGEX = /[\\n\\s]+/g\nconst sanitizeStyleValue = (value)"),
        "multiline value sanitizer should reuse a module-scope regex"
    );
    assert_snapshot!(function_block(source, "memo"), @r#"
    export function memo(fn) {
      const cache = new Map()
      const stringCache = new Map()
      const seen = new WeakSet()
      const newNode = () => ({ objects: new WeakMap(), prims: new Map(), out: void 0, has: false })
      const root = newNode()
      let lastHash
      let lastKey
      let lastValue
      let hasLast = false
      let misses = 0

      const step = (node, v) => {
        if (v !== null && typeof v === "object") {
          let next = node.objects.get(v)
          if (next === void 0) { next = newNode(); node.objects.set(v, next) }
          return next
        }
        let next = node.prims.get(v)
        if (next === void 0) {
          if (node.prims.size > 64) node.prims.clear()
          next = newNode()
          node.prims.set(v, next)
        }
        return next
      }
      const walk = (node, v) => {
        if (Array.isArray(v)) {
          node = step(node, "\u0000[")
          for (let i = 0; i < v.length; i++) node = walk(node, v[i])
          return step(node, "\u0000]")
        }
        return step(node, v)
      }
      const readWalk = (node, v) => {
        if (node === void 0) return void 0
        if (Array.isArray(v)) {
          node = node.prims.get("\u0000[")
          for (let i = 0; i < v.length && node !== void 0; i++) node = readWalk(node, v[i])
          return node === void 0 ? void 0 : node.prims.get("\u0000]")
        }
        return v !== null && typeof v === "object" ? node.objects.get(v) : node.prims.get(v)
      }
      const markSeen = (v) => {
        if (Array.isArray(v)) {
          let all = true
          for (let i = 0; i < v.length; i++) if (!markSeen(v[i])) all = false
          return all
        }
        if (v === null || typeof v !== "object") return true
        if (seen.has(v)) return true
        seen.add(v)
        return false
      }

      return ((...args) => {
        let composed = false
        for (let i = 0; i < args.length; i++) if (Array.isArray(args[i])) { composed = true; break }

        if (composed) {
          let node = root
          for (let i = 0; i < args.length && node !== void 0; i++) node = readWalk(node, args[i])
          if (node !== void 0 && node.has) return node.out

          const composedKey = JSON.stringify(args)
          let composedOut =
            hasLast && lastHash === void 0 && composedKey === lastKey ? lastValue : stringCache.get(composedKey)
          if (composedOut === void 0) {
            composedOut = fn(...args)
            stringCache.set(composedKey, composedOut)
            if (stringCache.size > 500) stringCache.delete(stringCache.keys().next().value)
          }

          let reused = false
          if ((++misses & 3) === 0) {
            reused = true
            for (let i = 0; i < args.length; i++) if (!markSeen(args[i])) reused = false
          }
          if (reused) {
            let insert = root
            for (let i = 0; i < args.length; i++) insert = walk(insert, args[i])
            insert.out = composedOut
            insert.has = true
          }
          lastHash = void 0
          lastKey = composedKey
          lastValue = composedOut
          hasLast = true
          return composedOut
        }

        const hash = flatHashOrNull(args)
        if (hash !== null) {
          if (hasLast && lastHash === hash && flatArgsEqual(args, lastKey)) return lastValue
          let bucket = cache.get(hash)
          if (bucket) {
            for (let i = 0; i < bucket.length; i++) {
              if (flatArgsEqual(args, bucket[i].args)) {
                lastHash = hash
                lastKey = args
                lastValue = bucket[i].out
                hasLast = true
                return bucket[i].out
              }
            }
          }
          const out = fn(...args)
          if (!bucket) {
            bucket = []
            cache.set(hash, bucket)
          }
          bucket.push({ args, out })
          if (bucket.length > 8) bucket.shift()
          if (cache.size > 500) cache.delete(cache.keys().next().value)
          lastHash = hash
          lastKey = args
          lastValue = out
          hasLast = true
          return out
        }

        const key = JSON.stringify(args)
        if (hasLast && lastHash === void 0 && key === lastKey) return lastValue
        const cached = stringCache.get(key)
        if (cached !== void 0) {
          lastHash = void 0
          lastKey = key
          lastValue = cached
          hasLast = true
          return cached
        }
        const out = fn(...args)
        stringCache.set(key, out)
        if (stringCache.size > 500) stringCache.delete(stringCache.keys().next().value)
        lastHash = void 0
        lastKey = key
        lastValue = out
        hasLast = true
        return out
      })
    }
    "#);
    assert_snapshot!(function_block(source, "weakMemo"), @r#"
    export function weakMemo(fn) {
      const cache = new WeakMap()
      return ((arg) => {
        if (!arg || typeof arg !== "object") return fn(arg)
        if (cache.has(arg)) return cache.get(arg)
        const out = fn(arg)
        cache.set(arg, out)
        return out
      })
    }
    "#);
    assert_snapshot!(function_block(source, "createSerializeCss"), @r#"
    export function createSerializeCss(context) {
      const u = context.utility
      const c = context.conditions
      const hash = context.hash
      const fmt = (s) => u.prefix ? u.prefix + "-" + s : s
      const toClass = (paths, name) => {
        const parts = c.finalize(paths)
        parts.push(hash ? name : fmt(name))
        return hash ? fmt(u.toHash(parts, toHash)) : parts.join(":")
      }
      return weakMemo(memo(function serializeCss({ base, ...styles } = {}) {
        const obj = normalizeStyleObject(base ? Object.assign(styles, base) : styles, context)
        const set = new Set()
        walkObject(obj, (value, paths) => {
          if (value == null) return
          const important = isImportant(value)
          const [prop, ...all] = c.shift(paths)
          const cond = filterBaseConditions(all)
          const res = u.transform(prop, withoutSpace(withoutImportant(sanitizeStyleValue(value))))
          let name = toClass(cond, res.className)
          if (important) name += "!"
          set.add(name)
        })
        let out = ""
        for (const name of set) out += out ? " " + name : name
        return out
      }))
    }
    "#);
}

#[test]
fn declarations_type_the_style_serializer_factories() {
    let helpers = generate_helpers(&UserConfig::default(), CodegenFormat::Js);

    assert_eq!(paths(&helpers), vec!["helpers.js", "helpers.d.ts"]);
    assert_snapshot!(declaration_lines(file(&helpers, "helpers.d.ts")), @"
    export declare function resolveStyleArgs(styles: Array<any> | IArguments, context: Record<string, any>): any[];
    export declare function createSerializeCss(context: Record<string, any>): (...styles: any[]) => string;
    export declare function createMergeCss(context: Record<string, any>): (...styles: any[]) => any;
    export declare function createSerializeCssArgs(serializeCss: (...styles: any[]) => string, mergeCss: (...styles: any[]) => any): (...styles: any[]) => string;
    export declare function createAssignCss(context: Record<string, any>): (...styles: any[]) => any;
    ");
}
