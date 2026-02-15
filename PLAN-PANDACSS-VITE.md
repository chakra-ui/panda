# Plan: `@pandacss/vite` — First-Class Vite Integration

> **Status**: Draft **Author**: segunadebayo **Date**: 2026-02-15 **Prior Art**: `@pandabox/unplugin` (astahmer),
> `@tailwindcss/vite` (Tailwind CSS v4)

---

## 1. Goals

1. **Replace PostCSS as the default Vite integration** — tighter hooks, faster HMR, no PostCSS overhead
2. **Inline everything at build time** — `css()`, `cva()`, `sva()`, JSX style props, patterns — all resolved to
   classNames at compile time. Only genuinely unresolvable expressions fall back to runtime.
3. **Best-in-class DX** — instant HMR, virtual CSS module, automatic codegen, clear error messages
4. **Production-grade** — SSR support, LightningCSS optimization, sourcemaps, Windows compat
5. **Zero runtime by default** — the plugin should eliminate all Panda runtime code for static usage. The shipped JS
   bundle should contain plain className strings, not style objects.

---

## 2. Architecture Overview

Following Tailwind's pattern, the plugin is an **array of focused Plugin objects**, not a single monolith.

```
@pandacss/vite (new package)
│
│  Returns Plugin[] (array of 4 Vite plugins)
│
├── [1] plugin-scan       (enforce: 'pre')
│       configResolved, configureServer
│       → Captures Vite config, creates PandaContext, runs codegen
│
├── [2] plugin-transform  (enforce: 'pre')
│       transform (JS/TS/JSX/TSX files)
│       → Extracts styles, inlines JSX props, resolves css()/cva() calls
│
├── [3] plugin-serve      (apply: 'serve', enforce: 'pre')
│       resolveId, load, transform (CSS)
│       → Serves virtual:panda.css, registers watch deps, handles HMR
│
└── [4] plugin-build      (apply: 'build', enforce: 'pre')
        resolveId, load, generateBundle
        → Serves virtual:panda.css, optimizes with LightningCSS
```

### Data Flow

```
Source file changed
    │
    ▼
[plugin-transform] intercepts .tsx/.ts/.jsx/.js
    │
    ├─ Parse with ctx.project.parseSourceFile(id)
    │  (reuses @pandacss/parser — ts-morph + extractor)
    │
    ├─ Inline resolution (always on):
    │  ├─ css() calls → replace with className string
    │  ├─ cva()/sva() calls → pre-resolve variant map to className strings
    │  ├─ JSX style props → replace with className prop on raw HTML element
    │  ├─ Pattern calls (hstack, stack) → resolve + inline
    │  ├─ Conditional expressions → resolve all branches when possible
    │  └─ Unresolvable expressions → keep runtime fallback (minimal shim)
    │
    ├─ Accumulate candidates in Root state
    │
    └─ If CSS changed → invalidate virtual:panda.css
            │
            ▼
[plugin-serve/build] serves virtual:panda.css
    │
    ├─ ctx.createSheet()
    ├─ ctx.appendLayerParams(sheet)
    ├─ ctx.appendBaselineCss(sheet)
    ├─ ctx.appendParserCss(sheet)
    ├─ ctx.getCss(sheet)
    │
    └─ Return { code: css, map }
```

---

## 3. Design Decisions

### 3.1 Vite-Native, Not Unplugin

`@pandabox/unplugin` uses the `unplugin` abstraction to target every bundler. For `@pandacss/vite`, we go Vite-native
because:

- Panda already has `@pandacss/postcss` for Webpack/other bundlers
- Vite-specific APIs (`this.addWatchFile`, filter API, `server.hot`, `configureServer`) enable better DX
- Tailwind proved a focused ~450-line plugin is better than a universal abstraction
- We can always add `@pandacss/webpack`, `@pandacss/rspack` later as separate focused packages

### 3.2 Virtual Module for CSS (Not Transform of Real CSS)

Unlike Tailwind (which transforms a real `input.css` file), Panda generates CSS from scratch. A virtual module
(`virtual:panda.css`) is the right fit:

```ts
// User's entry file
import 'virtual:panda.css' // or '@pandacss/vite/css'
```

This is what `@pandabox/unplugin` already does, and it eliminates the need for users to create a CSS file with `@layer`
directives.

**Fallback**: Also support transforming a real CSS file that contains `@layer panda` for users who prefer that pattern.

### 3.3 Inline-Everything-by-Default Strategy

The compiler inlines **all** Panda calls by default — no opt-in syntax needed. Every `css()`, `cva()`, `sva()`, pattern
call, and JSX style prop is resolved to a className string at build time. Only expressions the compiler genuinely cannot
evaluate are left as runtime calls.

**Philosophy**: The user writes `css({ color: "red.500" })` and it just becomes `"text_red.500"` in the output. No
`with { type: "macro" }`, no special import paths. It just works.

**Escape hatch**: Use `with { type: "runtime" }` to explicitly opt OUT of inlining for a specific import (e.g., when
building a library that needs runtime flexibility):

```ts
import { css } from 'styled-system/css' with { type: 'runtime' }
// This import will NOT be inlined — kept as runtime call
```

**Config override**:

| Mode              | Behavior                                                    |
| ----------------- | ----------------------------------------------------------- |
| `true` (default)  | Inline all Panda calls. Unresolvable expressions fall back. |
| `false`           | No JS transform, CSS generation only (like PostCSS mode).   |

```ts
pandacss({ optimizeJs: true }) // default
pandacss({ optimizeJs: false }) // CSS-only, no JS transforms
```

### 3.4 What Gets Inlined vs What Falls Back

The compiler resolves expressions aggressively. Here's the resolution hierarchy:

**Always inlined** (static values):

```ts
css({ color: 'red.500' })           → 'text_red.500'
css({ mt: 4, px: 2 })               → 'mt_4 px_2'
cva({ base: { display: 'flex' } })  → pre-resolved variant map
sva({ ... })                        → pre-resolved slot variant map
hstack({ gap: 4 })                  → 'd_flex flex_row gap_4'
<Box color="red.500" mt={4} />      → <div className="text_red.500 mt_4" />
<Button size="lg" />                → <button className="..." />
```

**Inlined with branch resolution** (conditional expressions where all branches are static):

```ts
css({ color: isDark ? 'white' : 'black' })
// → isDark ? 'text_white' : 'text_black'

<Box mt={size === 'lg' ? 8 : 4} />
// → <div className={size === 'lg' ? 'mt_8' : 'mt_4'} />
```

**Falls back to runtime** (genuinely unresolvable):

```ts
css(dynamicStyleObject)              // variable reference to unknown object
css({ [computedKey]: value })        // computed property key
<Box {...spreadProps} />             // spread — cannot know which props are styles
<Box color={getColor()} />           // function call result
```

When a fallback occurs, the compiler:
1. Keeps the original call as-is (using the runtime `css()` function)
2. Emits a build-time diagnostic (warning, not error) so users can optimize if they want
3. Still extracts the CSS for the known parts

### 3.5 HMR Strategy (Learned from Tailwind)

**Primary mechanism**: `this.addWatchFile()` + Vite's native CSS HMR.

```
Source file changes → Vite triggers re-transform of that file
  → plugin-transform extracts new styles, adds to candidate set
  → If candidate set changed, invalidate virtual:panda.css module
  → Vite re-runs the CSS load/transform → new CSS delivered via HMR
```

**Config file changes**: Use `configureServer` to set up a watcher on `panda.config.ts` and its dependencies. On change,
reload PandaContext entirely (reuse `DiffEngine` from `@pandacss/node`).

**No throttling needed**: Unlike `@pandabox/unplugin`'s 1000ms throttle, Vite's built-in debouncing + the additive
candidate model handle this naturally.

### 3.7 className Merge Utility (`cxm`)

When the inline compiler pre-resolves styles to className strings, conflicting classes can end up in the DOM together.
The runtime `css()` function avoids this by only emitting the winning class — but once we compile to strings, we need a
lightweight merge utility (`cxm`) to deduplicate conflicts.

#### 3.7.1 The Problem

```ts
// cva — base says px_4, variant overrides to px_2
const button = cva({
  base: { px: 4 },
  variants: { size: { sm: { px: 2 } } },
})

// Without cxm:
button({ size: 'sm' }) → cx('px_4', 'px_2') → 'px_4 px_2'
// Both classes in DOM. Winner depends on CSS source order, not class order. Fragile.

// With cxm:
button({ size: 'sm' }) → cxm('px_4', 'px_2') → 'px_2'
// Last one wins. Correct.
```

**Where `cxm` is needed:**

| Scenario                                      | Build-time cxm? | Runtime cxm? |
| --------------------------------------------- | ----------------- | -------------- |
| `css({ px: 4 }, { px: 2 })`                  | Yes (compiler)    | No             |
| `cva()` base + static variant                 | Yes (compiler)    | No             |
| `cva()` base + dynamic variant                | No                | **Yes**        |
| `<Box className={external} color="red" />`    | No                | **Yes**        |
| `cx(parentClass, childClass)` at boundaries   | No                | **Yes**        |
| Config recipe base + dynamic variant          | No                | **Yes**        |

#### 3.7.2 Understanding Panda's className Format

The cxm utility operates on className strings as they appear in the **DOM** (`element.className`), not in CSS
selectors. These are two different representations of the same class name:

| Context             | Format                                       | Example                                   |
| ------------------- | -------------------------------------------- | ----------------------------------------- |
| DOM class attribute | Raw characters, colons are literal            | `hover:fs_md`                             |
| CSS selector        | Special chars escaped via `esc()` from shared | `.hover\:fs_md`                           |

Panda's `esc()` function (from `@pandacss/shared/src/esc.ts`) escapes CSS-special characters for selectors. The cxm
utility works **before** escaping, on the raw DOM form.

**className anatomy** (DOM form):

```
[condition1]:[condition2]:property_value[!]
 └──────────────────────┘ └────────────┘ └┘
     conditions (0+)      property_value  important marker (optional)
     joined by ':'        (last segment)
```

**Real examples from the codebase** (CSS selector → DOM class):

| CSS Selector (from tests)                                 | DOM Class (what `cxm` sees)          |
| --------------------------------------------------------- | -------------------------------------- |
| `.c_red`                                                  | `c_red`                                |
| `.hover\:fs_md`                                           | `hover:fs_md`                          |
| `.sm\:hover\:bg-c_green`                                  | `sm:hover:bg-c_green`                  |
| `.hover\:focus\:fs_xl`                                    | `hover:focus:fs_xl`                    |
| `.hover\:disabled\:sm\:bg_red\.300`                       | `hover:disabled:sm:bg_red.300`         |
| `.dark\:fs_2xl`                                           | `dark:fs_2xl`                          |
| `.md\:c_red`                                              | `md:c_red`                             |
| `.c_red\!`                                                | `c_red!`                               |
| `.op_0\!`                                                 | `op_0!`                                |
| `.\[\&\[data-attr\=\'test\'\]\]\:c_green`                 | `[&[data-attr='test']]:c_green`        |
| `.\[\&\[data-attr\=\'test\'\]\]\:expanded\:c_purple`      | `[&[data-attr='test']]:expanded:c_purple` |
| `.\[\&_\>_p\]\:light\:bg_red400`                         | `[&_>_p]:light:bg_red400`             |
| `.md\:buttonStyle--size_md`                               | `md:buttonStyle--size_md`              |

**Key observations:**

1. The **last segment** (after the final `:` separator) is always `property_value` (e.g., `fs_md`, `bg-c_green`)
2. Everything before the last `:` is **conditions** (responsive, state, arbitrary selectors)
3. The `_` inside the last segment separates property from value: `fs` + `md`, `bg-c` + `green`
4. Important marker `!` is appended at the very end of the full class
5. Bracket conditions `[...]` can contain colons (e.g., `[&::placeholder]`), requiring bracket-aware parsing
6. With `prefix` option (e.g., `panda`), classNames become `panda-c_red` — the prefix is part of the property segment

#### 3.7.3 Parsing Algorithm

Two classes **conflict** if and only if they have the **same merge key**. The merge key is:

```
merge_key = conditions + ":" + property
```

Where:
- `conditions` = all segments except the last, joined by `:`
- `property` = everything before the first `_` in the last segment

```
Class:     hover:sm:bg-c_green
           ├────────┤ ├───┤
           conditions property
Merge key: hover:sm:bg-c

Class:     hover:sm:bg-c_red
Merge key: hover:sm:bg-c  ← SAME! These conflict. Last one wins.

Class:     hover:bg-c_red
Merge key: hover:bg-c     ← DIFFERENT (missing 'sm'). No conflict.
```

**Step-by-step for `getMergeKey(className)`:**

```
1. Strip trailing '!' if present (important marker)
2. Split by ':' with bracket-awareness (colons inside [...] don't count)
3. Last segment = property_value part
4. Find first '_' in last segment → everything before it is the property
5. If no '_' found → not a Panda class (return null)
6. Merge key = join(all_segments_except_last, ':') + ':' + property
   (or just property if no conditions)
```

#### 3.7.4 Bracket-Aware Splitting

The naive `className.split(':')` breaks on bracket conditions that contain colons:

```
[&::placeholder]:c_red
     ^^
     These colons are INSIDE the bracket condition, not separators!

Naive split: ['[&', '', 'placeholder]', 'c_red']  ← WRONG
Correct:     ['[&::placeholder]', 'c_red']         ← RIGHT
```

The splitting algorithm must track bracket depth:

```ts
function splitClassName(className: string): string[] {
  const segments: string[] = []
  let current = ''
  let bracketDepth = 0

  for (let i = 0; i < className.length; i++) {
    const ch = className[i]

    if (ch === '[') {
      bracketDepth++
      current += ch
    } else if (ch === ']') {
      bracketDepth--
      current += ch
    } else if (ch === ':' && bracketDepth === 0) {
      segments.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  if (current) segments.push(current)
  return segments
}
```

**Test cases:**

| Input                                        | Output segments                                      |
| -------------------------------------------- | ---------------------------------------------------- |
| `c_red`                                      | `['c_red']`                                          |
| `hover:c_red`                                | `['hover', 'c_red']`                                 |
| `sm:hover:bg-c_green`                        | `['sm', 'hover', 'bg-c_green']`                      |
| `[&::placeholder]:c_red`                     | `['[&::placeholder]', 'c_red']`                      |
| `[&[data-attr='test']]:expanded:c_purple`    | `['[&[data-attr=\'test\']]', 'expanded', 'c_purple']`|
| `[&_>_p]:light:bg_red400`                    | `['[&_>_p]', 'light', 'bg_red400']`                  |
| `hover:disabled:sm:bg_red.300`               | `['hover', 'disabled', 'sm', 'bg_red.300']`          |

#### 3.7.5 Full Implementation

Lives in **`@pandacss/shared/src/cxm.ts`** — pure functions, no dependencies, testable in isolation.
The `separator` (configurable: `_`, `=`, `-`) is passed as a parameter, not read from config.

```ts
// packages/shared/src/cxm.ts

/**
 * Split a className by ':' while respecting bracket boundaries.
 * Colons inside [...] are NOT treated as separators.
 */
export function splitClassName(className: string): string[] {
  const segments: string[] = []
  let current = ''
  let bracketDepth = 0

  for (let i = 0; i < className.length; i++) {
    const ch = className[i]

    if (ch === '[') {
      bracketDepth++
      current += ch
    } else if (ch === ']') {
      bracketDepth--
      current += ch
    } else if (ch === ':' && bracketDepth === 0) {
      if (current) segments.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  if (current) segments.push(current)
  return segments
}

/**
 * Extract the merge key from a Panda className.
 *
 * The merge key uniquely identifies the "slot" a class occupies:
 * same conditions + same property = conflict.
 *
 * @param className - a single className token (no spaces)
 * @param separator - the property/value separator from config ('_', '=', or '-')
 * @returns merge key string, or null if not a recognized Panda class
 */
export function getMergeKey(className: string, separator: string): string | null {
  // 1. Strip important marker
  let cls = className
  if (cls.endsWith('!')) {
    cls = cls.slice(0, -1)
  }

  // 2. Split by ':' with bracket-awareness
  const segments = splitClassName(cls)
  if (segments.length === 0) return null

  // 3. Last segment is property_value
  const last = segments[segments.length - 1]

  // 4. Find property (everything before first separator)
  const sepIdx = last.indexOf(separator)
  if (sepIdx < 1) return null  // no separator or starts with separator = not a Panda class

  const property = last.slice(0, sepIdx)

  // 5. Build merge key: conditions + property
  if (segments.length === 1) {
    return property
  }

  const conditions = segments.slice(0, -1).join(':')
  return conditions + ':' + property
}

/**
 * Merge className strings, deduplicating conflicting Panda utility classes.
 * Last occurrence wins for classes targeting the same CSS property + conditions.
 *
 * @param separator - the property/value separator from config ('_', '=', or '-')
 * @param classes - className strings to cxm
 */
export function cxm(separator: string, ...classes: (string | undefined | null | false)[]): string {
  const seen = new Map<string, string>()  // cxmKey → full className token
  const order: string[] = []              // cxmKey insertion order
  let id = 0

  for (const cls of classes) {
    if (!cls) continue
    for (const token of cls.split(' ')) {
      if (!token) continue
      const key = getMergeKey(token, separator)
      if (key !== null) {
        if (!seen.has(key)) order.push(key)
        seen.set(key, token)  // last one wins
      } else {
        // Not a recognized Panda class — always keep, never deduplicate
        const uniqueKey = `__` + id++
        order.push(uniqueKey)
        seen.set(uniqueKey, token)
      }
    }
  }

  return order.map((k) => seen.get(k)!).join(' ')
}
```

#### 3.7.5a Codegen Pipeline

The shared code flows through the same pipeline as `helpers.mjs`:

```
packages/shared/src/cxm.ts               ← source (TypeScript, tested directly)
    ↓ tsup build
packages/shared/dist/cxm.mjs             ← bundled ESM
    ↓ postbuild.ts (add entry: ['cxm.mjs', 'cxm.mjs'])
packages/generator/src/artifacts/generated/cxm.mjs.json    ← { "content": "..." }
    ↓ generator imports JSON, bakes in separator
styled-system/css/cxm.{js,d.ts}          ← emitted as generated code
```

**tsup.config.ts change** — add `cxm.ts` as a separate entry point:

```ts
// packages/shared/tsup.config.ts
export default defineConfig({
  entry: ['src/index.ts', 'src/shared.ts', 'src/astish.ts', 'src/normalize-html.ts', 'src/cxm.ts'],
  //                                                                                   ^^^^^^^^^^^^ new
  splitting: false,
  format: ['esm', 'cjs'],
})
```

**postbuild.ts change** — add to `fileMap`:

```ts
const fileMap = [
  ['shared.mjs', 'helpers.mjs'],
  ['astish.mjs', 'astish.mjs'],
  ['normalize-html.mjs', 'normalize-html.mjs'],
  ['cxm.mjs', 'cxm.mjs'],  // ← new
]
```

**Generator artifact** — `packages/generator/src/artifacts/js/cxm.ts`:

```ts
import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'
import cxmMjs from '../generated/cxm.mjs.json' assert { type: 'json' }

export function generateMerge(ctx: Context) {
  const { separator } = ctx.utility

  return {
    js: outdent`
    ${cxmMjs.content}

    const _cxm = cxm
    export const cxm = (...args) => _cxm('${separator}', ...args)
    `,
    dts: outdent`
      type Argument = string | boolean | null | undefined

      /** Merge className strings, deduplicating conflicting Panda utility classes. Last wins. */
      export declare function cxm(...args: Argument[]): string
    `,
  }
}
```

The generated output closes over the separator — users call `cxm('px_4', 'px_2')` without knowing or caring
about the separator config. The shared source takes it as a parameter so tests can exercise all three variants.

#### 3.7.6 Merge Key Examples (exhaustive, with default separator `_`)

| DOM Class                                      | Segments                                          | Property   | Merge Key                              |
| ---------------------------------------------- | ------------------------------------------------- | ---------- | -------------------------------------- |
| `c_red`                                        | `['c_red']`                                       | `c`        | `c`                                    |
| `bg-c_green`                                   | `['bg-c_green']`                                  | `bg-c`     | `bg-c`                                 |
| `hover:c_red`                                  | `['hover', 'c_red']`                              | `c`        | `hover:c`                              |
| `sm:hover:bg-c_green`                          | `['sm', 'hover', 'bg-c_green']`                   | `bg-c`     | `sm:hover:bg-c`                        |
| `hover:focus:fs_xl`                            | `['hover', 'focus', 'fs_xl']`                     | `fs`       | `hover:focus:fs`                       |
| `hover:disabled:sm:bg_red.300`                 | `['hover', 'disabled', 'sm', 'bg_red.300']`       | `bg`       | `hover:disabled:sm:bg`                 |
| `dark:fs_2xl`                                  | `['dark', 'fs_2xl']`                              | `fs`       | `dark:fs`                              |
| `md:c_red`                                     | `['md', 'c_red']`                                 | `c`        | `md:c`                                 |
| `c_red!`                                       | `['c_red']` (after strip `!`)                     | `c`        | `c`                                    |
| `op_0!`                                        | `['op_0']` (after strip `!`)                      | `op`       | `op`                                   |
| `[&[data-attr='test']]:c_green`                | `["[&[data-attr='test']]", 'c_green']`            | `c`        | `[&[data-attr='test']]:c`              |
| `[&[data-attr='test']]:expanded:c_purple`      | `["[&[data-attr='test']]", 'expanded', 'c_purple']` | `c`     | `[&[data-attr='test']]:expanded:c`     |
| `[&_>_p]:light:bg_red400`                      | `['[&_>_p]', 'light', 'bg_red400']`               | `bg`       | `[&_>_p]:light:bg`                     |
| `[&::placeholder]:c_red`                       | `['[&::placeholder]', 'c_red']`                   | `c`        | `[&::placeholder]:c`                   |
| `md:buttonStyle--size_md`                       | `['md', 'buttonStyle--size_md']`                   | `buttonStyle--size` | `md:buttonStyle--size`        |
| `my-custom-class`                              | `['my-custom-class']`                              | —          | `null` (no `_`)                        |
| `btn`                                          | `['btn']`                                          | —          | `null` (no `_`)                        |

#### 3.7.7 Conflict Detection Rules

**Two classes conflict if and only if:**

1. Both are recognized Panda classes (merge key is not null)
2. They have the **exact same merge key**

This means:

```ts
// All examples use default separator '_'. In generated code, separator is baked in.

// CONFLICT — same property, same conditions (none)
cxm('_', 'px_4', 'px_2')                      → 'px_2'

// CONFLICT — same property, same conditions (hover)
cxm('_', 'hover:px_4', 'hover:px_2')          → 'hover:px_2'

// NO CONFLICT — same property, different conditions
cxm('_', 'px_4', 'hover:px_2')                → 'px_4 hover:px_2'
cxm('_', 'sm:c_red', 'md:c_blue')             → 'sm:c_red md:c_blue'

// NO CONFLICT — different properties
cxm('_', 'px_4', 'py_2')                      → 'px_4 py_2'
cxm('_', 'c_red', 'bg-c_blue')                → 'c_red bg-c_blue'

// CONFLICT — important stripped for merge key, but original kept
cxm('_', 'c_red!', 'c_blue')                  → 'c_blue'

// NO CONFLICT — different condition count
cxm('_', 'hover:focus:c_red', 'hover:c_blue') → 'hover:focus:c_red hover:c_blue'

// NON-PANDA classes always kept
cxm('_', 'custom-class', 'px_4', 'custom-class') → 'custom-class px_4 custom-class'

// Works with other separators
cxm('=', 'px=4', 'px=2')                      → 'px=2'
cxm('-', 'px-4', 'px-2')                       → 'px-2'
```

**Condition order matters**: `hover:sm:c_red` and `sm:hover:c_red` produce different merge keys and are treated as
non-conflicting. This is correct — Panda's `conditions.sort()` normalizes condition order during className generation,
so the same style declaration always produces the same condition order. Two different orders means two genuinely different
style declarations (e.g., one written in source as `{ _hover: { sm: { color: 'red' } } }` vs
`{ sm: { _hover: { color: 'red' } } }`).

#### 3.7.8 Shorthand Property Awareness

Panda has shorthand utilities that expand to multiple CSS properties:

```ts
px: 4    → padding-left: 1rem; padding-right: 1rem  (generates class 'px_4')
pl: 2    → padding-left: 0.5rem                      (generates class 'pl_2')
```

The cxm utility using simple property-key matching treats `px` and `pl` as different properties — they won't conflict.
But logically, `pl_2` should override the `padding-left` component of `px_4`.

**Decision: Handle this at the compiler level, not in `cxm()`.**

The inline compiler has access to the full utility config and knows which properties are shorthands. When combining
class lists at build time, it can:

1. Expand shorthands to longhands before merging
2. Or generate longhand classes directly (e.g., `css({ px: 4, pl: 2 })` → `pr_4 pl_2` instead of `px_4 pl_2`)

The runtime `cxm()` function stays simple (no shorthand lookup table) because:
- The compiler resolves most shorthand conflicts at build time
- The remaining runtime merge scenarios (external className + component className) are rare shorthand-vs-longhand
  conflicts in practice
- Keeping `cxm` simple preserves the ~200B size advantage over tailwind-merge

**Phase 2 enhancement** (optional): Add a generated shorthand map that `cxm` can optionally consume:

```ts
// Generated from utility config at codegen time
const SHORTHAND_MAP = {
  px: ['pl', 'pr'],
  py: ['pt', 'pb'],
  p: ['pl', 'pr', 'pt', 'pb', 'px', 'py'],
  mx: ['ml', 'mr'],
  // ...etc (only ~15 entries for standard Panda shorthands)
}

// cxm() with optional shorthand awareness (~300B with map)
```

This map would be small because Panda has a fixed set of shorthand utilities, unlike Tailwind where the mapping is
much larger. But this is a Phase 2 enhancement — the base cxm utility works correctly for same-property conflicts.

#### 3.7.9 Hashed ClassNames

When `hash.className` is enabled (e.g., `cPbUdN` instead of `px_4`), the structured naming is lost:

- No separator character → `getMergeKey()` returns `null` for every class
- All classes treated as non-Panda → no deduplication
- `cxm()` degrades to `cx()` behavior (simple concatenation)

This is acceptable because:

1. **Build-time merge still works**: The compiler resolves conflicts using `StyleEncoder` (which knows the mapping)
   before generating hashed classNames. The output is already deduplicated.
2. **Runtime merge can't work**: Hashed classNames are opaque — there's no way to detect conflicts without a reverse
   lookup table. A warning is emitted if the user has both `hash.className: true` and runtime merging scenarios.
3. **Hash mode is opt-in**: Rarely used with dynamic patterns that need runtime merging.

#### 3.7.10 How the Inline Compiler Uses cxm

In generated code, `cxm()` has the separator baked in — users never see it. The examples below show the
**generated output** where `cxm(...)` is the wrapper that already closes over the separator:

The compiler uses `cxm` instead of `cx` wherever className sources need deduplication:

```ts
// cva output — uses cxm for base + variant combining
const button = (variants) => {
  const _v = Object.assign({ size: 'sm', visual: 'solid' }, variants)
  return cxm(
    'd_flex px_4',                                               // base
    { sm: 'h_8 fs_sm px_2', lg: 'h_12 fs_lg' }[_v.size],       // size variant (px_2 overrides px_4)
    { solid: 'bg-c_red.500 c_white', outline: 'bw_1px bc_red.500' }[_v.visual],
  )
}
// cxm('d_flex px_4', 'h_8 fs_sm px_2') → 'd_flex h_8 fs_sm px_2'  ← px_4 removed
```

```ts
// sva output — cxm per slot for conflict resolution
const card = (variants) => {
  const _v = Object.assign({}, variants)
  return {
    root: cxm('p_4', { sm: 'p_2', lg: 'p_8' }[_v.size]),
    header: 'fw_bold',
    body: 'mt_2',
  }
}
```

```ts
// JSX with existing className — uses cxm to resolve conflicts
<Box className={parentClass} color="red.500" />
// → <div className={cxm(parentClass, 'c_red.500')} />
```

```ts
// For pure concatenation (no possible conflicts), cx is still used:
// e.g., recipe base class + variant modifier class
const cls = cx('btn', 'btn--size_lg')  // no conflict possible (recipe naming)
```

**Decision rule for the compiler**: Use `cxm()` when combining classNames from different sources that could
potentially target the same CSS property. Use `cx()` when the sources are guaranteed non-overlapping (e.g., a recipe
name + a variant modifier).

#### 3.7.11 Bundle Size

| Utility          | Size (min+gzip) | When included                          |
| ---------------- | --------------- | -------------------------------------- |
| `cxm()`        | ~200B           | cva/sva with dynamic variants, JSX className merge |
| `cx()`           | ~50B            | Simple concatenation without conflicts |
| `tailwind-merge` | ~7KB            | (comparison)                           |

Panda's structured `property_value` naming convention eliminates the need for a lookup table. The cxm utility is
a simple string parser, not a domain-knowledge engine.

### 3.8 Mtime-Based Cache (Learned from Builder + Tailwind)

Reuse the existing `Builder.checkFilesChanged()` pattern — compare `mtime` timestamps to skip unnecessary re-parses. The
`Root` class (per CSS entry point) tracks:

```ts
class Root {
  candidates = new Set<string>() // Additive, never removed
  buildDeps = new Map<string, number>() // path → mtime
  lastCss: string | undefined // For diffing
}
```

---

## 4. Package Structure

```
packages/vite/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                # Main export: pandacss() → Plugin[]
│   ├── plugins/
│   │   ├── scan.ts             # Plugin 1: config + server setup
│   │   ├── transform.ts        # Plugin 2: JS/JSX inline compiler
│   │   ├── serve.ts            # Plugin 3: dev CSS serving
│   │   └── build.ts            # Plugin 4: prod CSS + optimization
│   ├── root.ts                 # Per-entry-point state management
│   ├── inline/
│   │   ├── index.ts            # Orchestrator: runs all inliners on a file
│   │   ├── css.ts              # css() → className string
│   │   ├── cva.ts              # cva() → pre-resolved variant function
│   │   ├── sva.ts              # sva() → pre-resolved slot variant function
│   │   ├── pattern.ts          # hstack()/vstack()/grid() → className string
│   │   ├── jsx.ts              # JSX style props → className on HTML element
│   │   ├── recipe.ts           # config recipe() → resolved className
│   │   ├── imports.ts          # Dead import elimination
│   │   ├── resolve.ts          # Static expression evaluator (ternary, &&, etc.)
│   │   └── diagnostics.ts      # Fallback warnings and build report
│   │
│   │   # cxm utility lives in @pandacss/shared (pure functions, tested in isolation)
│   │   # codegen: shared → JSON → generator → styled-system/css/cxm.js
│   │   # see: packages/shared/src/cxm.ts
│   └── types.ts                # Plugin options interface
└── __tests__/
    ├── plugin.test.ts          # Unit tests for plugin hooks
    ├── inline-css.test.ts      # css() inlining snapshots
    ├── inline-cva.test.ts      # cva()/sva() inlining snapshots
    ├── inline-jsx.test.ts      # JSX inlining snapshots
    ├── inline-patterns.test.ts # Pattern inlining snapshots
    ├── inline-recipes.test.ts  # Config recipe inlining snapshots
    ├── inline-imports.test.ts  # Dead import elimination
    ├── inline-resolve.test.ts  # Static expression evaluator
    ├── cxm.test.ts           # cxm() className merge utility
    └── e2e/                    # Integration tests
        ├── react/
        ├── solid/
        └── vue/
```

---

## 5. Plugin Options

```ts
interface PandaViteOptions {
  /** Path to panda.config.ts. Auto-detected if omitted. */
  configPath?: string

  /** Current working directory. Defaults to process.cwd(). */
  cwd?: string

  /**
   * Inline all Panda calls (css, cva, sva, patterns, JSX) at build time.
   * - true (default): inline everything, only unresolvable expressions fall back to runtime
   * - false: CSS generation only, no JS transforms (like PostCSS mode)
   */
  optimizeJs?: boolean

  /**
   * Run codegen automatically on server start.
   * Defaults to true.
   */
  codegen?: boolean

  /**
   * Output CSS to a file instead of virtual module.
   * When set, writes to this path instead of serving virtual:panda.css.
   */
  outfile?: string

  /**
   * Remove unused CSS variables and keyframes.
   * Defaults to true in build mode.
   */
  optimizeCss?: boolean

  /**
   * Log a warning when an expression can't be inlined and falls back to runtime.
   * Useful for finding optimization opportunities.
   * Defaults to true in development, false in production.
   */
  reportFallbacks?: boolean

  /**
   * File include patterns for JS transform.
   * Defaults to /\.[cm]?[jt]sx?$/
   */
  include?: RegExp | RegExp[]

  /**
   * File exclude patterns for JS transform.
   * Defaults to /node_modules|styled-system/
   */
  exclude?: RegExp | RegExp[]
}
```

---

## 6. Implementation Plan

### Phase 1: Core Plugin (CSS Generation + HMR)

**Goal**: Drop-in replacement for `@pandacss/postcss` in Vite projects.

#### 6.1.1 — Scaffold the Package

- Create `packages/vite/` with package.json, tsconfig
- Dependencies: `@pandacss/node`, `@pandacss/core`, `@pandacss/config`
- Peer dependency: `vite >= 5.0`
- Export `pandacss()` function returning `Plugin[]`

#### 6.1.2 — Plugin: Scan (`scan.ts`)

```ts
// Pseudo-code
{
  name: '@pandacss/vite:scan',
  enforce: 'pre',

  configResolved(config) {
    this.viteConfig = config
    this.isServe = config.command === 'serve'
    this.isBuild = config.command === 'build'
  },

  async configureServer(server) {
    // 1. Load panda config, create PandaContext
    this.root = new Root(options)
    await this.root.init()

    // 2. Run codegen if enabled
    if (options.codegen !== false) {
      await codegen(this.root.ctx)
    }

    // 3. Watch panda.config.ts + dependencies for changes
    for (const dep of this.root.configDeps) {
      server.watcher.add(dep)
    }
    server.watcher.on('change', async (file) => {
      if (this.root.isConfigDep(file)) {
        await this.root.reload()
        // Invalidate virtual CSS module
        const mod = server.moduleGraph.getModuleById(VIRTUAL_CSS_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.hot.send({ type: 'full-reload' })
      }
    })
  }
}
```

#### 6.1.3 — Plugin: Serve (`serve.ts`)

```ts
// Pseudo-code
{
  name: '@pandacss/vite:serve',
  apply: 'serve',
  enforce: 'pre',

  resolveId(id) {
    if (id === 'virtual:panda.css') return RESOLVED_VIRTUAL_ID
  },

  load(id) {
    if (id === RESOLVED_VIRTUAL_ID) {
      return this.root.generateCss()
    }
  },

  // Also handle transform of source files to extract styles
  transform: {
    filter: { id: { include: [/\.[cm]?[jt]sx?$/], exclude: [/node_modules/] } },
    async handler(code, id) {
      const hasNewCandidates = this.root.extractFile(id, code)

      if (hasNewCandidates) {
        // Invalidate virtual CSS module for HMR
        const mod = this.server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
        if (mod) this.server.moduleGraph.invalidateModule(mod)
        this.server.hot.send({
          type: 'update',
          updates: [{ type: 'css-update', path: VIRTUAL_CSS_ID, ... }]
        })
      }

      // Register source file as dependency of virtual CSS
      this.addWatchFile(id)
    }
  }
}
```

#### 6.1.4 — Plugin: Build (`build.ts`)

```ts
// Pseudo-code
{
  name: '@pandacss/vite:build',
  apply: 'build',
  enforce: 'pre',

  resolveId(id) {
    if (id === 'virtual:panda.css') return RESOLVED_VIRTUAL_ID
  },

  // In build mode, we need all source files processed before generating CSS.
  // Use generateBundle or a two-pass approach.
  async load(id) {
    if (id === RESOLVED_VIRTUAL_ID) {
      return '/*! PANDA_CSS */'  // Placeholder replaced in generateBundle
    }
  },

  transform: {
    filter: { id: { include: [/\.[cm]?[jt]sx?$/], exclude: [/node_modules/] } },
    handler(code, id) {
      // Extract styles from every source file
      this.root.extractFile(id, code)
    }
  },

  async generateBundle(_options, bundle) {
    const css = this.root.generateCss()

    // Optimize with LightningCSS or PostCSS
    const optimized = optimizeCss(css, {
      minify: this.viteConfig.build.minify !== false,
      lightningcss: this.root.ctx.config.lightningcss,
      browserslist: this.root.ctx.config.browserslist,
    })

    // Replace placeholder in CSS assets
    for (const chunk of Object.values(bundle)) {
      if (chunk.type === 'asset' && typeof chunk.source === 'string') {
        if (chunk.source.includes('/*! PANDA_CSS */')) {
          chunk.source = chunk.source.replace('/*! PANDA_CSS */', optimized)
        }
      }
    }
  }
}
```

#### 6.1.5 — Root State Class (`root.ts`)

Manages PandaContext lifecycle, candidate accumulation, and CSS generation.

```ts
class Root {
  ctx: PandaContext
  candidates = new Set<string>()
  lastCss: string | undefined
  configDeps = new Set<string>()
  fileMtimes = new Map<string, number>()

  async init() // Load config, create context
  async reload() // Reload config (on config change)
  extractFile(id, code) // Parse source file, accumulate candidates, return hasNew
  generateCss() // Create sheet → append baseline → append parser → getCss
  isConfigDep(file) // Check if file is a config dependency
}
```

Key reuse from `@pandacss/node`:

- `loadConfigAndCreateContext()` for initialization
- `PandaContext.parseFile()` for extraction
- `PandaContext.createSheet()` / `appendBaselineCss()` / `appendParserCss()` / `getCss()` for CSS generation
- `DiffEngine` for config change detection
- `getConfigDependencies()` for tracking config deps

---

### Phase 2: Inline Compiler (the core differentiator)

**Goal**: Resolve all Panda calls — `css()`, `cva()`, `sva()`, patterns, JSX — to className strings at build time.
Only genuinely unresolvable expressions fall back to runtime.

The inline compiler runs inside `plugin-transform` for every JS/TS/JSX/TSX file that imports from `styled-system/*`.
It works in a single pass using `magic-string` for source rewrites.

#### 6.2.1 — Transform: `css()` Calls

```ts
// Input
import { css } from 'styled-system/css'
const className = css({ display: 'flex', color: 'red.500', mt: 4 })

// Output
const className = 'd_flex text_red.500 mt_4'
```

```ts
// Input — merged style objects
const className = css({ display: 'flex' }, { color: 'red.500' })

// Output
const className = 'd_flex text_red.500'
```

```ts
// Input — conditional values (resolvable: both branches are static)
const className = css({ color: isDark ? 'white' : 'black' })

// Output — push the ternary outside
const className = isDark ? 'text_white' : 'text_black'
```

```ts
// Input — unresolvable
const className = css(getStyles())

// Output — kept as runtime, warning emitted
const className = css(getStyles())
```

**Implementation**: After `parseSourceFile()` returns `ParserResult`, walk the AST for `css()` CallExpressions.
For each argument, attempt to statically evaluate it:

1. Object literals with literal values → resolve via `StyleEncoder` + `StyleDecoder`
2. Object literals with conditional expressions (ternary, `&&`) → resolve each branch independently
3. Spread of a statically-known object → inline the spread
4. Anything else → mark as unresolvable, keep runtime call, emit diagnostic

#### 6.2.2 — Transform: `cva()` / `sva()` Calls

```ts
// Input
import { cva } from 'styled-system/css'

const button = cva({
  base: { display: 'flex', px: 4 },
  variants: {
    size: {
      sm: { h: 8, fontSize: 'sm' },
      lg: { h: 12, fontSize: 'lg' },
    },
    visual: {
      solid: { bg: 'red.500', color: 'white' },
      outline: { borderWidth: '1px', borderColor: 'red.500' },
    },
  },
  compoundVariants: [
    { size: 'sm', visual: 'solid', css: { px: 2 } },
  ],
  defaultVariants: { size: 'sm', visual: 'solid' },
})
```

```ts
// Output — fully pre-resolved variant map, using cxm() for conflict resolution
const button = (variants) => {
  const _v = Object.assign({ size: 'sm', visual: 'solid' }, variants)
  return cxm(
    'd_flex px_4',                                               // base
    { sm: 'h_8 fs_sm', lg: 'h_12 fs_lg' }[_v.size],            // size variant
    { solid: 'bg_red.500 text_white', outline: 'bw_1px bc_red.500' }[_v.visual],  // visual variant
    _v.size === 'sm' && _v.visual === 'solid' ? 'px_2' : '',    // compound (px_2 overrides base px_4)
  )
}
```

The `cxm()` import is the primary runtime needed — a ~200 byte className deduplication helper (see section 3.7).
For cases with no possible conflicts, the compiler uses `cx()` (~50 bytes) instead.

**`sva()` follows the same pattern** but returns a slot map:

```ts
// Input
const card = sva({
  slots: ['root', 'header', 'body'],
  base: { root: { p: 4 }, header: { fontWeight: 'bold' }, body: { mt: 2 } },
  variants: { size: { sm: { root: { p: 2 } }, lg: { root: { p: 8 } } } },
})

// Output — cxm() resolves p_4 vs p_2/p_8 conflict in root slot
const card = (variants) => {
  const _v = Object.assign({}, variants)
  return {
    root: cxm('p_4', { sm: 'p_2', lg: 'p_8' }[_v.size]),
    header: 'fw_bold',
    body: 'mt_2',
  }
}
```

#### 6.2.3 — Transform: Pattern Functions

```ts
// Input
import { hstack, vstack, grid } from 'styled-system/patterns'

const a = hstack({ gap: 4, align: 'center' })
const b = vstack({ gap: 2 })
const c = grid({ columns: 3, gap: 4 })

// Output
const a = 'd_flex flex_row gap_4 items_center'
const b = 'd_flex flex_col gap_2'
const c = 'd_grid grid-cols_3 gap_4'
```

**Implementation**: Use `ctx.patterns.transform(patternName, props)` to resolve the pattern to a style object, then
encode/decode to classNames.

For patterns with dynamic arguments, resolve what we can:

```ts
// Input — partial resolution
const cls = hstack({ gap: spacing, align: 'center' })

// Output — static parts inlined, dynamic parts use runtime
const cls = css({ display: 'flex', flexDir: 'row', gap: spacing, alignItems: 'center' })
// ↓ further resolved to:
const cls = cx('d_flex flex_row items_center', css({ gap: spacing }))
```

#### 6.2.4 — Transform: JSX Style Props

```ts
// Input
import { Box, HStack } from 'styled-system/jsx'

<Box color="red.500" mt={4} onClick={handler}>
  <HStack gap={2} align="center">
    <Text fontSize="lg">Hello</Text>
  </HStack>
</Box>

// Output
<div className="text_red.500 mt_4" onClick={handler}>
  <div className="d_flex flex_row gap_2 items_center">
    <p className="fs_lg">Hello</p>
  </div>
</div>
```

**Implementation**:

1. Match JSX elements using `JsxEngine.match()` (already exists in `@pandacss/core`)
2. For each prop, classify: **static style prop**, **dynamic style prop**, **HTML prop**, **ref/key**
3. Static style props → resolve to classNames via encoder/decoder
4. Dynamic style props → collect into a runtime `css()` call
5. Merge all classNames: `cxm(existingClassName, staticClasses, css(dynamicStyles))` — `cxm` handles conflicts
6. Replace JSX tag with the underlying HTML element
7. Remove styled-system/jsx import if all usages were inlined

**Edge cases and how we handle them**:

```ts
// Spread props — cannot inline the component, keep as styled component
<Box {...props} color="red.500" />
// → kept as: <Box {...props} color="red.500" />
// (we still extract CSS, but cannot replace the JSX element)

// css prop with static object — inline
<Box css={{ color: 'red.500', _hover: { color: 'blue.500' } }} />
// → <div className="text_red.500 hover:text_blue.500" />

// css prop with dynamic value — partial inline
<Box mt={4} css={{ color: themeColor }} />
// → <div className={cxm('mt_4', css({ color: themeColor }))} />

// Recipe component with static variant — inline
<Button size="lg" variant="solid" />
// → <button className="btn btn--size_lg btn--variant_solid" />

// Forwarded ref — inline but preserve ref
<Box ref={myRef} color="red.500" />
// → <div ref={myRef} className="text_red.500" />

// Conditional rendering — both branches inlined
<Box color={isActive ? 'green.500' : 'gray.500'} />
// → <div className={isActive ? 'text_green.500' : 'text_gray.500'} />

// as prop — use the specified element
<Box as="section" color="red.500" />
// → <section className="text_red.500" />
```

#### 6.2.5 — Transform: Config Recipes

```ts
// Input
import { button } from 'styled-system/recipes'
const cls = button({ size: 'lg', visual: 'solid' })

// Output — fully resolved
const cls = 'btn btn--size_lg btn--visual_solid'
```

For dynamic variant selection:

```ts
// Input
const cls = button({ size: selectedSize })

// Output — variant map lookup (cx here since recipe name + variant modifier don't conflict)
const cls = cx('btn', { sm: 'btn--size_sm', lg: 'btn--size_lg' }[selectedSize])
```

#### 6.2.6 — Dead Import Elimination

After inlining, many imports from `styled-system/*` become unused. The compiler removes them:

```ts
// Before
import { css } from 'styled-system/css'
import { Box, HStack } from 'styled-system/jsx'
import { hstack } from 'styled-system/patterns'

// After inlining (if all calls were resolved)
import { cx } from 'styled-system/css'
// All other imports removed — only cx needed for joining strings
```

If ALL calls in a file were fully static (no runtime fallbacks), the file has zero Panda runtime dependency.

#### 6.2.7 — Minimal Runtime (`cxm` + `cx`)

The compiler generates code that uses two tiny runtime helpers:

```ts
// cxm() — className deduplication (~200 bytes)
// Used when combining classNames from different sources that may conflict
export function cxm(...classes) { /* see section 3.7 */ }

// cx() — simple concatenation (~50 bytes)
// Used when sources are guaranteed non-overlapping
export function cx(...args: (string | undefined | null | false)[]) {
  return args.filter(Boolean).join(' ')
}
```

Together these replace the full `css()` runtime (~2KB), `splitProps()`, JSX factory, etc. The compiler generates the
same classNames that the runtime would, but at build time.

**What the compiler emits per file:**

| File contents                        | Runtime imports          |
| ------------------------------------ | ------------------------ |
| All static, no conflicts possible    | None (zero runtime)      |
| Static with cx joins                 | `cx` (~50B)              |
| cva/sva with dynamic variants        | `cxm` (~200B)          |
| JSX with existing className          | `cxm` (~200B)          |
| Some unresolvable expressions        | `cxm` + `css` (~2.2KB) |

For files that have unresolvable expressions, the full `css()` runtime is kept only for those specific calls.

---

### Phase 3: Production Hardening

#### 6.3.1 — SSR Support

Follow Tailwind's pattern: use `DefaultMap<string, Root>` keyed by Vite environment name. This ensures separate
candidate sets for SSR vs client builds.

```ts
const roots = new DefaultMap<string, Root>((env) => new Root(options, env))
```

#### 6.3.2 — LightningCSS Build Compatibility

Fix the known issue from `@pandabox/unplugin` where styles are dropped when Vite uses `css.transformer: 'lightningcss'`.
The fix: ensure the virtual module's CSS is fully self-contained and doesn't rely on PostCSS-specific features that
LightningCSS discards.

#### 6.3.3 — Source Maps

Generate source maps in dev mode when `config.css.devSourcemap` is enabled. Return `{ code, map }` from the `load` hook
for the virtual CSS module.

For JS transforms (`optimizeJs`), use `magic-string`'s `.generateMap()` for accurate source maps.

#### 6.3.4 — Windows Path Handling

Normalize all paths using `path.normalize()` and handle Windows separators consistently. Test on Windows CI.

#### 6.3.5 — Edge Cases

- `?inline` and `?url` CSS queries — skip virtual module resolution
- CSS Modules interaction — ensure virtual:panda.css works alongside `.module.css` files
- `@import` within virtual module — not supported, document limitation
- HMR across multiple entry points — each gets its own Root instance
- Vite library mode — ensure plugin works for component library builds

---

### Phase 4: Testing

#### 6.4.1 — Unit Tests

- `root.test.ts` — Root state management, candidate accumulation, CSS diffing
- `inline-css.test.ts` — `css()` inlining snapshots:
  - Static object → string literal
  - Multiple arguments → merged string
  - Conditional values (ternary) → branch resolution
  - Nested conditions (`_hover`, `md:`) → resolved
  - Unresolvable → kept as runtime, warning emitted
- `inline-cva.test.ts` — `cva()`/`sva()` inlining snapshots:
  - Full variant map → pre-resolved function
  - Compound variants → conditional expressions
  - Default variants → applied in output
  - `sva()` slot map → per-slot resolved function
- `inline-jsx.test.ts` — JSX inlining snapshots:
  - Static props → className on HTML element
  - Dynamic props → partial inline + runtime fallback
  - Spread props → skip transform
  - `css` prop → inline if static
  - `as` prop → correct element
  - `ref` forwarding → preserved
  - Recipe components → resolved variant classes
- `inline-patterns.test.ts` — Pattern inlining snapshots:
  - All built-in patterns (hstack, vstack, grid, etc.)
  - Partial resolution (some static, some dynamic args)
- `inline-recipes.test.ts` — Config recipe inlining snapshots
- `inline-imports.test.ts` — Dead import elimination
- `inline-fallbacks.test.ts` — Diagnostics and fallback behavior
- `packages/shared/__tests__/cxm.test.ts` — `cxm()` className merge utility (tested in shared, not vite):
  - **splitClassName**:
    - Simple: `'c_red'` → `['c_red']`
    - Conditions: `'sm:hover:bg-c_green'` → `['sm', 'hover', 'bg-c_green']`
    - Bracket conditions: `'[&::placeholder]:c_red'` → `['[&::placeholder]', 'c_red']`
    - Nested brackets: `"[&[data-attr='test']]:expanded:c_purple"` → correct segments
    - Mixed: `'[&_>_p]:light:bg_red400'` → `['[&_>_p]', 'light', 'bg_red400']`
  - **getMergeKey** (with separator param):
    - Default `_`: `getMergeKey('px_4', '_')` → `'px'`
    - Equals `=`: `getMergeKey('px=4', '=')` → `'px'`
    - Dash `-`: `getMergeKey('px-4', '-')` → `'px'`
    - With conditions: `getMergeKey('hover:sm:bg-c_green', '_')` → `'hover:sm:bg-c'`
    - With important: `getMergeKey('c_red!', '_')` → `'c'` (strips `!`)
    - Bracket condition: `getMergeKey('[&::placeholder]:c_red', '_')` → `'[&::placeholder]:c'`
    - Non-panda: `getMergeKey('my-custom-class', '_')` → `null`
    - No separator: `getMergeKey('btn', '_')` → `null`
  - **cxm** (with separator as first arg):
    - Same property: `cxm('_', 'px_4', 'px_2')` → `'px_2'`
    - Same property + condition: `cxm('_', 'hover:px_4', 'hover:px_2')` → `'hover:px_2'`
    - Different conditions: `cxm('_', 'px_4', 'hover:px_2')` → `'px_4 hover:px_2'`
    - Different properties: `cxm('_', 'px_4', 'py_2')` → `'px_4 py_2'`
    - Important: `cxm('_', 'c_red!', 'c_blue')` → `'c_blue'`
    - Non-panda preserved: `cxm('_', 'custom', 'px_4', 'custom')` → `'custom px_4 custom'`
    - Hashed classes: falls back to concatenation
    - Falsy inputs: `cxm('_', 'px_4', null, undefined, '', 'mt_2')` → `'px_4 mt_2'`
    - Multi-class strings: `cxm('_', 'd_flex px_4', 'h_8 px_2')` → `'d_flex h_8 px_2'`
    - Bracket conditions: `cxm('_', '[&::placeholder]:c_red', '[&::placeholder]:c_blue')` → `'[&::placeholder]:c_blue'`
    - Condition order: `cxm('_', 'hover:sm:c_red', 'sm:hover:c_blue')` → both kept (different order = different key)
    - Equals separator: `cxm('=', 'px=4', 'px=2')` → `'px=2'`
    - Dash separator: `cxm('-', 'px-4', 'px-2')` → `'px-2'`
- `plugin.test.ts` — Plugin hook behavior (resolveId, load, transform)

#### 6.4.2 — Integration Tests (E2E)

- `e2e/react/` — React + Vite, dev + build, HMR verification
- `e2e/solid/` — SolidJS + Vite
- `e2e/vue/` — Vue + Vite (requires vue-to-tsx transform)
- `e2e/ssr/` — SSR mode verification
- `e2e/library/` — Vite library mode

#### 6.4.3 — CSS Output Stability

**Critical**: The CSS output from `@pandacss/vite` must be identical to `@pandacss/postcss` for the same source files.
Add a comparison test that runs both plugins on the same fixture and asserts CSS equality.

---

## 7. Migration Path

### For Users

```diff
// vite.config.ts

- import pandacss from '@pandacss/dev/postcss'
+ import pandacss from '@pandacss/vite'

export default defineConfig({
-  css: {
-    postcss: {
-      plugins: [pandacss()],
-    },
-  },
+  plugins: [pandacss()],
})
```

```diff
// main.tsx
- import './index.css'          // file with @layer panda directives
+ import 'virtual:panda.css'    // or '@pandacss/vite/css'
```

```diff
// postcss.config.cjs — can be deleted entirely for Vite projects
- module.exports = {
-   plugins: {
-     '@pandacss/dev/postcss': {},
-   },
- }
```

### Inline Resolution (On by Default)

No additional config needed. All Panda calls are inlined automatically:

```ts
// This just works — css() is resolved at build time
import { css } from 'styled-system/css'
import { Box } from 'styled-system/jsx'
import { hstack } from 'styled-system/patterns'

const cls = css({ color: 'red.500' }) // → 'text_red.500'
const layout = hstack({ gap: 4 })     // → 'd_flex flex_row gap_4'
<Box mt={4}>Hello</Box>                // → <div className="mt_4">Hello</div>
```

To opt out of inlining for a specific import (e.g., library code that needs runtime flexibility):

```ts
import { css } from 'styled-system/css' with { type: 'runtime' }
// This import stays as a runtime call
```

To disable JS inlining entirely (CSS-only mode, like PostCSS):

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    pandacss({ optimizeJs: false }),
  ],
})
```

---

## 8. Key Dependencies

| Dependency         | Purpose                                             | From     |
| ------------------ | --------------------------------------------------- | -------- |
| `@pandacss/node`   | PandaContext, config loading, codegen               | Existing |
| `@pandacss/core`   | StyleEncoder, StyleDecoder, Stylesheet, optimizeCss | Existing |
| `@pandacss/parser` | Source file parsing, style extraction               | Existing |
| `@pandacss/config` | findConfig, getConfigDependencies                   | Existing |
| `magic-string`     | Source code transforms with source maps             | New dep  |
| `vite`             | Peer dependency (>= 5.0)                            | Peer     |

**No new heavy dependencies.** `magic-string` is already used by Vite itself, so it's effectively free.

---

## 9. API Stability Concern

The Vite plugin depends on these `@pandacss/node` / `@pandacss/core` internals:

| API                             | Used For      | Stability                                     |
| ------------------------------- | ------------- | --------------------------------------------- |
| `loadConfigAndCreateContext()`  | Init          | Stable (used by PostCSS + CLI)                |
| `PandaContext`                  | Everything    | Stable (used by PostCSS + CLI)                |
| `ctx.project.parseSourceFile()` | Extraction    | Stable (used by Builder)                      |
| `ctx.createSheet()`             | CSS gen       | Stable (used by Builder + CLI)                |
| `ctx.appendBaselineCss()`       | CSS gen       | Stable                                        |
| `ctx.appendParserCss()`         | CSS gen       | Stable                                        |
| `ctx.getCss()`                  | CSS gen       | Stable                                        |
| `StyleEncoder`                  | optimizeJs    | Semi-stable (internal but unlikely to change) |
| `StyleDecoder`                  | optimizeJs    | Semi-stable                                   |
| `codegen()`                     | Artifact gen  | Stable (used by CLI)                          |
| `DiffEngine`                    | Config reload | Stable (used by Builder)                      |

The core CSS generation APIs are already stable — they're the same ones `@pandacss/postcss` and the CLI use. The only
risk is `StyleEncoder`/`StyleDecoder` for the `optimizeJs` feature, but those are fundamental to the architecture and
unlikely to have breaking changes.

---

## 10. Milestones

| Milestone | Deliverable                                             | Scope                         |
| --------- | ------------------------------------------------------- | ----------------------------- |
| **M1**    | Core plugin: virtual CSS, HMR, codegen                  | Phase 1 (6.1.1–6.1.5)        |
| **M2**    | Inline `css()` and pattern calls                        | Phase 2 (6.2.1, 6.2.3)       |
| **M3**    | Inline `cva()`/`sva()` with variant map resolution      | Phase 2 (6.2.2)              |
| **M4**    | Inline JSX style props + config recipes                 | Phase 2 (6.2.4, 6.2.5)       |
| **M5**    | Dead import elimination + conditional branch resolution | Phase 2 (6.2.6, 6.2.1 cond.) |
| **M6**    | SSR, LightningCSS compat, sourcemaps                    | Phase 3                       |
| **M7**    | Full test suite, docs, release                          | Phase 4                       |

M1 is the MVP — it replaces `@pandacss/postcss` for Vite users with better DX. M2–M5 are the inline compiler —
the core performance differentiator. M6–M7 are production hardening.

---

## 11. Open Questions

1. **Should we coordinate with astahmer to upstream `@pandabox/unplugin`?** His `optimizeJs` implementation is
   battle-tested and covers many edge cases. Forking vs collaborating.

2. **Should `virtual:panda.css` also support `@import` syntax?** e.g., `@import 'virtual:panda/tokens.css'` for split
   CSS loading.

3. **Should we support a `"transform"` mode that rewrites real CSS files (like Tailwind) in addition to virtual
   modules?** Some users may prefer seeing a real CSS file.

4. **What's the minimum Vite version?** Vite 5.0 for baseline, Vite 6.0 for the Environment API (multi-environment SSR).
   We could support both with a feature check.

5. **How aggressive should conditional branch resolution be?** For ternaries like `css({ color: x ? 'red' : 'blue' })`,
   we can resolve both branches. But what about `switch` statements, `if/else` chains, or `||`/`??` operators? Need to
   define the exact boundary of "resolvable".

6. **Should the inline compiler support template literal syntax?** e.g., `` css`color: red.500` ``. This is a different
   extraction path in the parser.

7. **Should `cxm()` be exported as a public API for users?** Users doing manual className composition
   (e.g., component libraries) would benefit from `import { cxm } from 'styled-system/css'`. This would make Panda's
   `cxm` the official replacement for `tailwind-merge` in the Panda ecosystem.

8. **Should we generate a build report?** A summary of: X calls inlined, Y fell back to runtime, Z bytes of runtime
   eliminated. This would be valuable for users to understand the optimization impact.
