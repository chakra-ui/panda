# NAPI Boundary

## Summary

`packages/binding/crate` is the only crate that knows about NAPI. Compiler logic lives in `crates/pandacss_extractor`
and the rest of the workspace; the binding crate mirrors core types into `#[napi]`-shaped structs and wires up the
JS-facing functions. This isolation keeps the core crates free of NAPI assumptions (owned arguments, no `&str`, no
`Option<T>` for `null`) so future non-NAPI consumers (a CLI binary, a Wasm build) can use the same crates unchanged.

## What lives in the binding crate

```
packages/binding/crate/src/
  lib.rs       — shared cross-module types (Span, SourceLocation, Diagnostic, ExtractedArg)
  matcher.rs   — Matchers / Matcher / MatchCategory mirrors + match_imports
  imports.rs   — ImportRecord mirrors + scan_imports
  calls.rs     — ExtractedCall mirror + extract_calls
  jsx.rs       — ExtractedJsx mirror + extract_jsx
  extract.rs   — ExtractResult / ExtractDebugResult + extract / extract_debug
  compile.rs   — CompileInput / Output mirrors + compile (placeholder)
  session.rs   — Extractor class (recommended batch entrypoint)
  convert.rs   — pandacss_extractor::X ↔ X conversion helpers
```

Conversion lives in `convert.rs` so the per-function modules stay readable. Every `pandacss_extractor::X` shape has a
sibling `X` `#[napi(object)]` mirror — the conversion is mechanical and centralized.

## ExtractedArg: tagged for unambiguous null

```rust
#[napi(string_enum = "camelCase")]
pub enum ExtractedArgKind {
    Value,
    Missing,
}

#[napi(object)]
pub struct ExtractedArg {
    pub kind: ExtractedArgKind,
    pub value: Option<serde_json::Value>,
}
```

The previous shape was `Array<unknown | null>`, which collapsed two distinct cases:

- A real `null` literal in source: `css(null)` → folded value is `Literal::Null`.
- A non-foldable argument: `css(getConfig())` → no value to record.

JS callers couldn't tell them apart. The tagged shape solves it:

- `{ kind: "value", value: null }` — real null literal.
- `{ kind: "missing", value: undefined }` — non-foldable.

`ExtractedCall::data.length` always matches source arity. Positional `None` slots are preserved so consumers know
_which_ argument was non-literal.

## Extractor session class

The free `extract()` / `extract_debug()` functions accept `Matchers` by value and convert the inner token dictionary on
every call. For batch extraction across many files against the same design tokens, that rebuild cost is O(tokens ×
files) of pure waste.

`Extractor` flips it:

```js
const extractor = new Extractor(matchers)
for (const file of files) {
  const result = extractor.extract(file.source, file.path)
}
```

The class owns a prebuilt `pandacss_extractor::ExtractorConfig` (matchers + materialized token dictionary). Per-file
calls skip the dictionary rebuild. This is the **recommended path for production / batch extraction**; free functions
stay around for one-off CLI use and tests.

## Cross-file resolution on the session

`Extractor` is also where cross-file resolution is wired up explicitly. The flat `Matchers` shape (preserved for JS-wire
compat) doesn't surface `CrossFileResolver` — the session class adds it through a separate method. Free-function callers
always extract single files, so a per-call cache wouldn't help them anyway.

## NAPI quirks the binding handles

- **`#[napi]` functions can't take `&str`.** Use owned `String` with
  `#[allow(clippy::needless_pass_by_value, reason = "NAPI requires owned arguments")]`.
- **`Option<T>` accepts `undefined` / omitted, but not `null`.** TS callers should leave the field off, not pass `null`.
- **`#[napi(string_enum = "camelCase")]`** for discriminated unions.
- **`#[napi(object)]`** for plain data; `#[napi]` for constructable classes.

## Performance: serialization cost is real

Every `Literal::to_json()` materializes a `serde_json::Value` that crosses the NAPI boundary. For tooling APIs
(`extract*()` returns JSON for JS consumption), this is unavoidable — JS callers want JSON.

**The production hot path (`compile()`) must never reach this conversion.** When the real pipeline lands, the engine
keeps `Literal` → encoder → emitter → optimizer entirely in Rust and returns compact CSS plus a manifest. Don't call
`to_json()` from inside `compile()`. There's a `PERF(port)` marker on `to_call` in `convert.rs` calling this out.

## Loader and fallback

The TS wrapper (`packages/binding/src/index.ts`) defines the public API and a no-op fallback for unsupported platforms.
`src/load-binary.ts` looks for `binding.node` next to the package root, then falls back to `@pandacss/binding-native`.
The native artifact and its auto-generated `native.d.ts` are gitignored.

## Related

- [extraction-pipeline](./extraction-pipeline.md)
- [project-lifecycle](./project-lifecycle.md)
- [publish-namespace](./publish-namespace.md)
