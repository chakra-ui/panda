# Token Reference Syntax (`$`)

## Summary

v1 had a `tokens:created` hook that let users rename tokens — almost everyone used it for one thing: adding a
Stitches-style `$` prefix. v2 does not port the hook. Instead, set `tokenSyntax: '$'` and the parser accepts
`$` as token syntax in style values: `color: '$red.500'`.

Key idea: `$` is **syntax the parser understands**, not part of the token's name. The dictionary, CSS variables,
`{}` references, and all Rust internals keep canonical names. No JS callback anywhere.

Status: proposed (not yet implemented).

## Why

What users want (researched 2026-06-11):

- [#2398](https://github.com/chakra-ui/panda/discussions/2398) — make tokens visually distinct from plain CSS values
  (`color: 'blue'` is ambiguous, `color: '$blue'` is not) and sort first in IntelliSense.
- Code search: 13 public repos use the hook; nearly all are the same one-liner `'$' + path.join('-' or '.')`.

Why renaming (the v1 approach) was broken: once `$red.500` is the token's actual *name*, the engine can no longer
recognize token references:

- [#2667](https://github.com/chakra-ui/panda/issues/2667) — opacity modifier: `$red.500/50` leaks `$` into CSS.
- [#2260](https://github.com/chakra-ui/panda/issues/2260) — hook is lost when shared via `presets`.
- [#2734](https://github.com/chakra-ui/panda/issues/2734) — `padding: '$5 $10'` fails. Note: v1 *never* resolved
  multi-value tokens — bare lookup is exact whole-string (`values[value]`), so `'5 10'` never worked either. The hook
  made `$5` work and users expected Stitches semantics; renaming structurally can't deliver them, syntax can.

Stitches never had these bugs because it did syntax, not rename: tokens are *defined* without `$`
(`colors: { violet800 }`) and *referenced* with `$` (`backgroundColor: '$violet800'`, `margin: '$1 $2'`). Resolution
uses a property → scale map — same concept as Panda's utility → token-category mapping. (Category mapping exists
today; multi-value splitting like `padding: '$2 $4'` is new parser work that the `$` makes feasible.)

A config option also beats a hook on every axis: no per-token JS call across the NAPI boundary, shorthands and
opacity modifiers work by construction, and plain config data merges through `presets` normally.

## Design

- Config: standalone `tokenSyntax?: '$'` — typed as the literal, not `string`, so autocomplete shows the one valid
  value and widening later is non-breaking. Deliberately **not** under `prefix`. The
  `prefix.*` members namespace *emitted CSS* (`--panda-colors-red-500`, `.panda-text_…`); `tokenSyntax` configures
  *authoring spelling* and touches no output. Putting it next to `prefix.cssVar` invites mixups in both directions
  (users call token CSS variables "token vars"). It configures a spelling, not a rename — document it that way.
- `prefix` stays `string | { cssVar?: string; className?: string }`, but the bare-string form is dropped anyway in v2
  (one shape at the Rust boundary, explicit over implicit). Config load rejects strings with the object replacement in
  the error message. Weaker argument than when `tokens` lived in the object — revisit if the churn isn't worth it.
- When enabled, `$red.500` is **the only** token spelling in style values (replaces bare `red.500`). Resolved through
  the property's token category. Works in shorthands and with `/opacity`.
- `{colors.red.500}` references stay valid everywhere (config and style values).
- Bare values that match a known token get a "did you mean `$red.500`?" diagnostic.
- Typegen: emit `$`-spelled unions **instead of** bare names — a swap, so type size and tsc cost are unchanged.
- Custom utility/pattern callbacks receive canonical values — the engine strips the `$` first. (Stitches leaked it
  and users hand-stripped: [stitches#894](https://github.com/stitchesjs/stitches/issues/894).)
- Docs: `$` becomes reserved in token-value positions. Say it explicitly — Stitches didn't and it bit people
  ([stitches#825](https://github.com/stitchesjs/stitches/issues/825)).

Not ported: `$$localTokens`, the `$colors$blue` cross-category spelling (`{colors.blue}` covers it), Stitches'
`-$2` calc shorthand, and `formatCssVar` (use `prefix.cssVar` / `cssVarRoot`).

## Scope

Where the `$` applies and where it doesn't:

- **Usage side (scanned source): yes.** `css()`, JSX style props, `cva`/`sva` variants, pattern props — same parser,
  same typegen swap.
- **Definition side (config): no.** `globalCss`, config recipes, `textStyles`/`layerStyles`, pattern defaults, and
  token values keep canonical names + `{}` refs. Rule of thumb: *define canonical, consume with `$`*. This keeps npm
  presets working — they can't know the app's spelling choice. `value: '$red.500'` in token definitions gets a
  diagnostic pointing to `{colors.red.500}`.
- **Composite values: use `{}`.** Stitches resolved `$` anywhere in a string (`border: '1px solid $blue500'`), but an
  unqualified spelling can't pick a category inside composite values (`border` segments span colors/borders/spacing).
  `$` works in token positions (whole value, shorthand segments); embedded refs stay `{colors.red.500}`. Documented
  divergence from Stitches.
- **Tooling.** Diagnostics, `panda debug`, the MCP server, and the eslint plugin should print/recognize the configured
  spelling once enabled.

## Migration (v1 hook → v2)

```ts
// v1
hooks: {
  'tokens:created': ({ configure }) => {
    configure({ formatTokenName: (path) => '$' + path.join('.') })
  },
}

// v2
tokenSyntax: '$'
```

- Spell tokens as `$` + dotted path: `color: '$red.500'`. If your v1 formatter joined with dashes (`$red-500`),
  find-replace to dots — the `$` is configurable, the path format is not.
- `{}` references, `token(...)` calls, semantic token values, and CSS variable names are untouched.
- Opacity modifiers now work (broken under the hook), and multi-value shorthands (`padding: '$2 $4'`) work for the
  first time — v1 never resolved them, with or without the hook.
- If you shared the hook via a preset and it silently did nothing (#2260): `tokenSyntax` merges fine; delete the
  plugin wrapper.
- Arbitrary renames (dasherize etc.) are intentionally unsupported — renaming is the bug factory this note closes.
  Keep canonical names; enforce conventions with `strictTokens` / lint rules.
- The bare-string `prefix` is gone. Replace it with the object form:

  ```ts
  // v1
  prefix: 'panda'

  // v2
  prefix: { cssVar: 'panda', className: 'panda' }
  ```

  Config load rejects strings with this replacement in the error message.

## Decisions

Recommendations recorded 2026-06-11; confirm before implementation.

- **Exclusive spelling.** Once enabled, `$` is the only way to write tokens in style values. Teams adopt this as a
  convention; accepting both spellings forever undermines it and would double CSS for mixed spellings. Presets and
  `buildinfo` are unaffected (they use canonical names and `{}` refs). The diagnostic guides migration.
- **`token()` / `token.var()` don't take `$`.** The `$` spelling is category-*relative* (`$5` means spacing or sizes
  depending on the property); `token()` takes category-*absolute* paths (`colors.red.500`) and has no property context.
  Supporting `$` there would require the rejected `$colors.red.500` form. Stitches made the same split — its `theme`
  API never parsed `$` — and the one ask for it ([stitches#904](https://github.com/stitchesjs/stitches/issues/904))
  is already covered by `token()` (raw value) + `token.var()` (reference).
- **`strictTokens` uses the `$`.** With `tokenSyntax` on, strictTokens unions are `$`-spelled and known CSS
  keywords are allowed *without* brackets: `'$red.500' | … | CssKeyword<P> | '[…]'`. The bracket escape existed only
  because tokens and keywords were indistinguishable — the `$` removes that ambiguity, so requiring `'[inherit]'`
  would keep the #2398 friction for nothing. Arbitrary values (`#fff`, `calc(…)`) stay bracketed: that's a type-system
  constraint, not a choice — adding `string` to the union would swallow the token literals and kill autocomplete.
  Without `tokenSyntax`, strictTokens behaves exactly as today. Typegen-only change; no engine impact.
  The keyword set must reuse the `strictPropertyValues` machinery (csstype-derived per-property values), not a
  second list — coordinate the two options at implementation time.

## Related

- [hooks](./hooks.md) — `tokens:created` is listed under Class A but is superseded by this note.
- [generated-types-design](./generated-types-design.md) — instantiation budget the typegen swap must respect.
- [config-loading-design](./config-loading-design.md) — where `prefix` config is resolved and serialized.
