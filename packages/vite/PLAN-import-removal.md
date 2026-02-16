# Plan: Dead import removal after inlining

## Context

The inline compiler replaces `css()`, `cva()`, `sva()`, pattern calls, and JSX components with static classNames or lightweight runtime helpers. After transformation, the original panda imports become dead code:

```tsx
// After inlining (current)
import { css } from "styled-system/css"       // ← dead, still bundled
import { Box } from "styled-system/jsx"        // ← dead, still bundled

const cls = "d_flex"
const App = () => <div className="mt_4" />
```

Without removing these imports, the panda runtime is still bundled — defeating the purpose of the inline optimization.

## Approach: Text-based reference checking

After all MagicString transformations complete:

1. Get the transformed source via `ms.toString()`
2. Strip import lines to get the "code body"
3. Parse original import declarations (regex on original `code`)
4. For each panda import specifier, check if its local name still appears in the code body via `\b<name>\b`
5. If a specifier is dead → remove it. If all specifiers in a declaration are dead → remove the whole line.

**Why text-based?** It's simpler than count-tracking and handles all bail-out cases automatically — if `css.raw()` wasn't inlined, `css` still appears in the code body, so the import is kept.

**Why `\b` word boundary is safe:**
- `__cva` helper: `\bcva\b` does NOT match `__cva` because `_` is a word character (no boundary between `_` and `c`)
- Same for `__sva`
- Import removal runs BEFORE runtime helpers are prepended, so helpers aren't in the check

## What to handle

| Import source | Specifiers | Dead when... |
|---|---|---|
| `styled-system/css` | `css`, `cva`, `sva`, `cx` | All call sites inlined |
| `styled-system/patterns` | `hstack`, `vstack`, etc. | All call sites inlined |
| `styled-system/recipes` | `buttonStyle`, etc. | All call sites inlined |
| `styled-system/jsx` | `styled`, `Box`, `HStack`, etc. | All JSX elements inlined |

**Skip:** `import type { ... }` (already erased at compile), side-effect imports `import "..."`, `styled-system/tokens` (not inlined).

**Partial removal:** `import { css, cx } from "styled-system/css"` → if only `css` is dead, rewrite to `import { cx } from "styled-system/css"`.

**Namespace imports:** `import * as p from "styled-system/patterns"` → if `p` not referenced, remove.

## Files to create/modify

### New: `packages/vite/src/inline/imports.ts`

```ts
import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'

/**
 * Remove panda import specifiers that are no longer referenced
 * after inlining. Must be called BEFORE runtime helper injection.
 */
export function removeDeadImports(ms: MagicString, code: string, ctx: PandaContext): boolean

// Helpers:
// - getPandaModulePaths(ctx) — collect all paths from ctx.imports.value (css, recipe, pattern, jsx, tokens)
// - isPandaModule(mod, paths) — check if module specifier matches
// - Parse imports from `code` with regex
// - Check references in `ms.toString()` minus import lines
```

Key implementation detail: use `ctx.imports.value` (type `ImportMapOutput<string>`) which has:
```ts
{
  css: ['styled-system/css'],        // or custom paths
  recipe: ['styled-system/recipes'],
  pattern: ['styled-system/patterns'],
  jsx: ['styled-system/jsx'],
  tokens: ['styled-system/tokens'],
}
```

### Modify: `packages/vite/src/inline/index.ts`

Reorder `inlineFile()`:
1. All inlining passes (css, cva, sva, patterns, recipes, jsx) — unchanged
2. **NEW:** `removeDeadImports(ms, code, ctx)` — after inlining, before helpers
3. Prepend runtime helpers (`CVA_HELPER`, `SVA_HELPER`)

### New tests: `packages/vite/__tests__/inline-imports.test.ts`

- `css()` fully inlined → `import { css }` removed
- `css()` partially inlined (one bails) → import kept
- `css.raw()` bail-out → import kept
- Multiple specifiers, partial dead → rewrite import with survivors
- Pattern import fully inlined → removed
- JSX import fully inlined → removed
- Mixed file: css + pattern + jsx, all inlined → all imports removed
- Non-panda imports preserved
- `import type` declarations preserved

## Implementation order

1. Create `packages/vite/src/inline/imports.ts` with `removeDeadImports`
2. Wire into `inlineFile()` in `packages/vite/src/inline/index.ts`
3. Add tests in `packages/vite/__tests__/inline-imports.test.ts`
4. Run all tests

## Verification

```bash
pnpm test packages/vite/__tests__/
```

All 46 existing tests should still pass, plus new import removal tests.
