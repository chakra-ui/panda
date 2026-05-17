# JS Bindings (NAPI + WASM)

## Summary

Panda's Rust pipeline ships through two cdylib crates with a shared philosophy: thin mirror types over the core
`pandacss_*` crates, generic logic stays in core, the binding crate just plumbs values across the JS boundary. The
binding crates are deliberate exceptions to the `pandacss_*` naming rule because the cdylib output filename is
load-bearing on the JS side.

| Crate                                          | Target                                  | Output                                                           | JS package               |
| ---------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- | ------------------------ |
| `packages/binding/crate` (`binding_napi`)      | Native (NAPI)                           | `binding.node`                                                   | `@pandacss/binding`      |
| `packages/binding-wasm/crate` (`binding_wasm`) | `wasm32-unknown-unknown` (wasm-bindgen) | `pkg-node/binding_wasm_bg.wasm` + `pkg-web/binding_wasm_bg.wasm` | `@pandacss/binding-wasm` |

Both depend on `pandacss_fs` with a single feature toggled (`os` for NAPI, `memory` for wasm) plus the rest of the core
crates with `default-features = false` to keep wasm bundles lean.

## What lives in the binding crates

```
packages/binding/crate/src/                  # NAPI
  lib.rs        shared cross-module types (Span, SourceLocation, Diagnostic, ExtractedArg)
  matcher.rs    Matchers / Matcher / MatchCategory mirrors + match_imports
  imports.rs    ImportRecord mirrors + scan_imports
  calls.rs      ExtractedCall mirror + extract_calls
  jsx.rs        ExtractedJsx mirror + extract_jsx
  extract.rs    ExtractResult / ExtractDebugResult + extract / extract_debug
  compile.rs    CompileInput / Output mirrors + compile (placeholder)
  project.rs    Project class; config-based construction, parseFile, atoms, recipes
  session.rs    Extractor class (recommended batch entrypoint)
  convert.rs    pandacss_extractor::X ↔ X conversion helpers

packages/binding-wasm/crate/src/             # WASM
  lib.rs        re-exports + installPanicHook
  fs.rs         WasmFileSystem (handle over MemoryFileSystem)
  matcher.rs    MatchersInput shape + to_core_matchers / to_core_token_dictionary
  extract.rs    WasmExtractor (parseFile)
```

NAPI uses napi-rs's macro pattern (`#[napi(object)]` for plain data, `#[napi]` for constructable classes) with a
per-function mirror module. Wasm uses `#[wasm_bindgen]` plus `serde-wasm-bindgen` so most types cross the boundary as
serde-serialized JS objects rather than declared mirror types — less code to maintain at the cost of slightly higher
per-call serialization overhead. The wasm side is the playground path, not the production hot path, so the trade is
worth it.

## ExtractedArg: tagged for unambiguous null (NAPI)

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

The wasm binding uses raw JSON via `serde-wasm-bindgen` so positional `null` vs `undefined` is unambiguous through the
encoding directly — no equivalent shape needed.

## Project class (NAPI)

`Project.fromConfig(config)` is the preferred production entrypoint. The JS side passes the resolved, serialized Panda
config snapshot; the binding deserializes it into `pandacss_config::Config` and calls
`pandacss_project::Project::from_config(config)`. That path is fallible: config compilation errors, such as invalid
serialized JSX regexes, are mapped to `napi::Error`.

The constructor that accepts explicit matchers remains for lower-level extraction tests and compatibility. It bypasses
config-derived matchers, utilities, conditions, patterns, and recipes, so new production behavior should be added to the
config/System path first.

## Extractor session class (NAPI)

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

## WasmExtractor (browser playground)

The wasm binding takes a different shape because source discovery lives in JS (React state, in the playground). A
`WasmFileSystem` handle is passed in alongside matchers; the `WasmExtractor` wires up the cross-file resolver against
that same FS internally.

```ts
import { createExtractor } from '@pandacss/binding-wasm'

const { fs, extractor } = await createExtractor(matchers)
fs.addFile('/proj/tokens.ts', "export const brand = '#ef4444';")
const result = extractor.parseFile('/proj/main.tsx', source)
```

Why a shared FS handle:

- Multiple `WasmExtractor` instances can target the same project state by cloning the FS handle. Cheap — `Arc<RwLock>`
  internally.
- Cross-file resolution (`import { x } from './tokens'`) works because the resolver shares the FS — playground edits
  push files into the FS and the resolver sees them immediately.
- The browser host doesn't need to round-trip source through the binding; it owns the canonical state.

## NAPI quirks the native binding handles

- **`#[napi]` functions can't take `&str`.** Use owned `String` with
  `#[allow(clippy::needless_pass_by_value, reason = "NAPI requires owned arguments")]`.
- **`Option<T>` accepts `undefined` / omitted, but not `null`.** TS callers should leave the field off, not pass `null`.
- **`#[napi(string_enum = "camelCase")]`** for discriminated unions.
- **`#[napi(object)]`** for plain data; `#[napi]` for constructable classes.

## WASM quirks the wasm binding handles

- **`serde-wasm-bindgen` defaults to `Map` for serialized maps**, not plain `{}` objects. We configure the serializer
  with `serialize_maps_as_objects(true)` for results crossing the boundary so JS callers see expected JSON shapes.
- **`wasm-opt` needs `--all-features`** because Rust emits post-MVP wasm instructions (bulk-memory, mutable-globals,
  sign-ext) that the wasm-pack-bundled wasm-opt rejects by default. Set in `Cargo.toml`
  `[package.metadata.wasm-pack.profile.release]`.
- **Two `wasm-pack` targets**: `nodejs` (CommonJS, for Vitest + SSR) and `web` (ESM with `fetch`-based init, for the
  browser). Both ship in the npm package under `pkg-node/*` and `pkg-web/*`.
- **No async**: the wasm crate is sync-only. Async would pull in `wasm-bindgen-futures` and complicate the bundle.
- **Panic hook**: `install_panic_hook()` (exported as `installPanicHook`) routes Rust panics through `console.error` for
  readable stack traces. Called automatically by `loadWasm()` in the TS wrapper.

## Bundle size

Current wasm bundle: **~1.3 MB raw, ~490 KB gzipped** for `pkg-web/binding_wasm_bg.wasm`. Under the 500 KB gzipped
playground target. Composition:

- Bulk of size is `oxc_parser` + `oxc_semantic` (AST + scope resolution).
- `fast-glob`, `pandacss_fs`, `pandacss_extractor` together add a few percent.
- `wasm-opt -Oz --all-features` strips ~30% off the unoptimized output.

Future budget: keeping under 500 KB gzipped means no big new dep gets added casually. Anything that doubles size needs
benchmarks first.

## Performance: serialization cost is real

Every `Literal::to_json()` materializes a `serde_json::Value` that crosses the NAPI boundary. For tooling APIs
(`extract*()` returns JSON for JS consumption), this is unavoidable — JS callers want JSON.

**The production hot path (`compile()`) must never reach this conversion.** When the real pipeline lands, the engine
keeps `Literal` → encoder → emitter → optimizer entirely in Rust and returns compact CSS plus a manifest. Don't call
`to_json()` from inside `compile()`. There's a `PERF(port)` marker on `to_call` in `convert.rs` calling this out.

The wasm binding sidesteps the JSON intermediate by using `serde-wasm-bindgen` directly, but the cost is similar —
serializing `Literal` to `JsValue` walks the same tree. Same constraint applies: keep heavy data in Rust where possible.

## Loader and fallback (NAPI)

The TS wrapper (`packages/binding/src/index.ts`) defines the public API and a no-op fallback for unsupported platforms.
`src/load-binary.ts` looks for `binding.node` next to the package root, then falls back to `@pandacss/binding-native`.
The native artifact and its auto-generated `native.d.ts` are gitignored.

## JS-host config callbacks

Resolved config snapshots can carry callback references for config entries that cannot be represented as plain JSON.
The serialized config stores a stable id, and the live JS function is kept in a sidecar callback map:

```ts
{
  config: {
    utilities: {
      size: {
        transform: { kind: "js-callback", id: "utilities.size.transform" },
      },
    },
  },
  callbacks: {
    "utility.transform": {
      "utilities.size.transform": (value, args) => ({ width: value, height: value }),
    },
  },
}
```

The callback kinds are intentionally different:

- `utility.transform` maps one utility atom to direct CSS declaration objects. The original atom's condition chain is
  preserved after expansion; returned keys such as `sm`, `tablet`, or `_hover` are **not** interpreted as conditions.
- `pattern.transform` runs before atomic encoding and returns a full system style object. Pattern output can contain
  nested config-derived conditions and breakpoints because it flows back through the normal style encoder.
- `utility.values` affects utility metadata and type/value availability. Prefer serializing resolved data when
  possible; only keep it executable if the JS config model truly requires it.

Current support:

- NAPI registers `utility.transform` callbacks on the native `Project` when the binary exposes
  `registerUtilityTransform`.
- NAPI registers `pattern.transform` callbacks on the native `Project` when the binary exposes
  `registerPatternTransform`.
- Utility transform results are cached by callback id, property, and raw value. The cached result is condition-free;
  the original atom's conditions are applied after expansion.
- The TS wrapper keeps a compatibility fallback for older native binaries and uses the same cache shape.
- WASM executes `utility.transform` in the JS host wrapper because browser callbacks are already JS-owned.

Remaining work:

- Fill out `TransformArgs`: real `token(path)`, `token.raw(path)`, and `utils.colorMix(value)` instead of stubs.
- Add WASM/browser support for `pattern.transform`. The native shape is in place, but the browser wrapper still needs a
  pre-encoding host callback path.
- Decide whether `utility.values` should stay callback-based or become resolved data in the serialized config.
- Add diagnostics for lazy utility callback failures. Native `pattern.transform` failures are attached to `parseFile()`;
  utility transform diagnostics may need to live on `atoms()` or move callback execution into `parseFile()`.

## Loader (WASM)

`packages/binding-wasm/src/index.ts` exposes `loadWasm()` (lazy, cached) for Node consumers and `createExtractor()` for
the common case. Browser consumers can also import directly from `@pandacss/binding-wasm/pkg-web/*` and call
wasm-bindgen's `init()` themselves when they need control over the wasm fetch.

## Related

- [filesystem](./filesystem.md) — the FS abstraction both bindings consume.
- [extraction-pipeline](./extraction-pipeline.md) — core extract() flow the bindings wrap.
- [project-lifecycle](./project-lifecycle.md) — Project contract.
- [publish-namespace](./publish-namespace.md) — naming rules for both bindings.
