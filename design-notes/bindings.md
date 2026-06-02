# JS Bindings (NAPI + WASM)

## Summary

Panda's Rust pipeline ships through two cdylib crates with a shared philosophy: thin mirror types over the core
`pandacss_*` crates, generic logic stays in core, the binding crate just plumbs values across the JS boundary. The
binding crates are deliberate exceptions to the `pandacss_*` naming rule because the cdylib output filename is
load-bearing on the JS side.

| Crate                                          | Target                                  | Output                                                           | JS package               |
| ---------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- | ------------------------ |
| `packages/compiler/crate` (`compiler_napi`)      | Native (NAPI)                           | `compiler.node`                                                   | `@pandacss/compiler`      |
| `packages/compiler-wasm/crate` (`compiler_wasm`) | `wasm32-unknown-unknown` (wasm-bindgen) | `pkg-node/compiler_wasm_bg.wasm` + `pkg-web/compiler_wasm_bg.wasm` | `@pandacss/compiler-wasm` |

Both depend on `pandacss_fs` with a single feature toggled (`os` for NAPI, `memory` for wasm) plus the rest of the core
crates with `default-features = false` to keep wasm bundles lean.

## What lives in the binding crates

```
packages/compiler/crate/src/                  # NAPI
  lib.rs        shared cross-module types (Span, SourceLocation, Diagnostic, ExtractedArg)
  matcher.rs    Matchers / Matcher / MatchCategory mirrors + match_imports
  imports.rs    ImportRecord mirrors + scan_imports
  calls.rs      ExtractedCall mirror + extract_calls
  jsx.rs        ExtractedJsx mirror + extract_jsx
  extract.rs    ExtractResult / ExtractDebugResult + extract / extract_debug
  compile.rs    legacy CompileInput / Output mirrors
  project.rs    Project class; config-based construction, parseFile, atoms, recipes, compile
  session.rs    Extractor class (recommended batch entrypoint)
  convert.rs    pandacss_extractor::X ↔ X conversion helpers

packages/compiler-wasm/crate/src/             # WASM
  lib.rs        re-exports + installPanicHook
  cache.rs      utility/pattern transform callback caches
  fs.rs         WasmFileSystem (handle over MemoryFileSystem)
  matcher.rs    MatchersInput shape + to_core_matchers / to_core_token_dictionary
  extract.rs    WasmExtractor (parseFile)
  project.rs    WasmProject; config-based construction, parseFile, atoms, recipes
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
config snapshot; the binding deserializes it into `pandacss_config::UserConfig` and calls
`pandacss_project::Project::from_config(config)`. That path is fallible: config compilation errors, such as invalid
serialized JSX regexes, are mapped to `napi::Error`.

The matcher-based project constructor was intentionally removed. Raw matcher flows belong to the extractor session
(`new Extractor(matchers)`) and staged extraction helpers; stateful projects are config-derived only.

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
import { createExtractor } from '@pandacss/compiler-wasm'

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

Current wasm bundle: **~1.3 MB raw, ~490 KB gzipped** for `pkg-web/compiler_wasm_bg.wasm`. Under the 500 KB gzipped
playground target. Composition:

- Bulk of size is `oxc_parser` + `oxc_semantic` (AST + scope resolution).
- `fast-glob`, `pandacss_fs`, `pandacss_extractor` together add a few percent.
- `wasm-opt -Oz --all-features` strips ~30% off the unoptimized output.

Future budget: keeping under 500 KB gzipped means no big new dep gets added casually. Anything that doubles size needs
benchmarks first.

## Native compile path

`Project.compile()` is the production native CSS path. It stays on the Rust side after callbacks have been applied:

1. borrow the project-wide dynamic atom set from `pandacss_project::Project`
2. materialize callback-expanded atoms only when JS utility transforms are registered
3. snapshot dynamic recipes
4. compute a static recipe snapshot from the compiled project/config
5. call `pandacss_stylesheet::compile()`

The binding caches the parsed `UserConfig` on `Project` construction so each compile does not clone and deserialize the
entire JSON config again. The current output is `{ css, sourceMap, manifest, diagnostics }`; `sourceMap` and manifest
hashes are still placeholders.

`pandacss_stylesheet` emits and writer-minifies CSS. It does not run a CSS optimizer. The old `optimize` knob was removed
from the native API so the boundary is explicit.

## Performance: serialization cost is real

Every `Literal::to_json()` materializes a `serde_json::Value` that crosses the NAPI boundary. For tooling APIs
(`extract*()` returns JSON for JS consumption), this is unavoidable — JS callers want JSON.

**The production hot path (`compile()`) must never reach this conversion.** When the real pipeline lands, the engine
keeps `Literal` → encoder → stylesheet emitter entirely in Rust and returns compact CSS plus a manifest. Don't call
`to_json()` from inside `compile()`. There's a `PERF(port)` marker on `to_call` in `convert.rs` calling this out.

The wasm binding sidesteps the JSON intermediate by using `serde-wasm-bindgen` directly, but the cost is similar —
serializing `Literal` to `JsValue` walks the same tree. Same constraint applies: keep heavy data in Rust where possible.

## Loader and fallback (NAPI)

The TS wrapper (`packages/compiler/src/index.ts`) defines the public API and a no-op fallback for unsupported platforms.
`src/load-binary.ts` looks for `compiler.node` next to the package root, then falls back to `@pandacss/compiler-native`.
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
- `pattern.defaultValues` runs in the JS host before `pattern.transform`. Explicit props override defaults.
- `utility.values` affects utility metadata and type/value availability. Prefer serializing resolved data when
  possible; only keep it executable if the JS config model truly requires it.

Current support:

- NAPI registers `utility.transform` callbacks on the native `Project` when the binary exposes
  `registerUtilityTransform`. The registered function is the TS host wrapper, so Rust calls it with only the raw value;
  the wrapper passes real `TransformArgs` (`token`, `token.raw`, and `utils.colorMix`) to the user callback.
- NAPI registers `pattern.transform` callbacks on the native `Project` when the binary exposes
  `registerPatternTransform`. The registered function is also host-wrapped so pattern helpers and default values stay in
  JS rather than being stubbed in Rust.
- Utility transforms execute during `parseFile()` / `refreshFile()` for file-derived atoms and encoded recipe entries.
  `atoms()` and `encodedRecipes()` are pure reads and never call back into JS.
- Utility transform results are cached by callback id, property, and raw value. The cached result is condition-free;
  the original atom or recipe entry conditions are applied after expansion. Failed callback executions are reported as
  `parseFile()` diagnostics and are not cached, so the next parse can retry the callback.
- WASM registers both `utility.transform` and `pattern.transform` callbacks through the TS host wrapper. Pattern
  and utility callbacks are installed before `parseFile()` so the Rust project can call back into JS before atomic
  encoding.
- WASM pattern transform results are cached by callback id, pattern name, and serialized props. Thrown callbacks become
  `parseFile()` diagnostics; failed calls are not cached.
- `@pandacss/compiler-wasm` exposes `createCompilerFromWasmModule(mod, config, options)` for browser callers that import
  `pkg-web/compiler_wasm.js` directly and call wasm-bindgen's `init()` themselves. This preserves the same callback
  registration path as Node's `createCompiler()`.

Remaining work:

- Decide whether `utility.values` should stay callback-based or become resolved data in the serialized config.
- Decide whether config/static CSS utility transforms should keep using the shared parse-time callback bridge or move to
  a separate compile-time diagnostic surface.

## Loader (WASM)

`packages/compiler-wasm/src/index.ts` exposes `loadWasm()` (lazy, cached) and `createCompiler()` for Node consumers.
Browser consumers can import directly from `@pandacss/compiler-wasm/pkg-web/*` and call wasm-bindgen's `init()`
themselves when they need control over the wasm fetch, then pass the initialized module to
`createCompilerFromWasmModule()` so config callbacks are still registered before parsing.

## Browser-only subpath export (`./web`)

`@pandacss/compiler-wasm` ships a `./web` subpath export (`dist/web.mjs`) that carries only the wasm-module facade —
`createCompilerFromWasmModule` and the shared types — with **no** `import('../pkg-node/...')` in its module graph.

Because `src/web.ts` never references `pkg-node`, tsup injects no Node `fileURLToPath` shim into `dist/web.mjs`.
Browser bundlers (webpack, Vite) that stub or remove `node:url` will not throw at module-eval time.

```ts
import initWasm, * as wasmMod from '@pandacss/compiler-wasm/pkg-web/compiler_wasm.js'
import { createCompilerFromWasmModule } from '@pandacss/compiler-wasm/web'

await initWasm(new URL('/compiler_wasm_bg.wasm', window.location.origin))
const compiler = createCompilerFromWasmModule(wasmMod, config, options)
```

The main `"."` entry still re-exports everything from `./web` plus `loadWasm` / `createCompiler` /
`createCompilerFromSnapshot`, so Node consumers and existing tests are unaffected.

## Related

- [filesystem](./filesystem.md) — the FS abstraction both bindings consume.
- [extraction-pipeline](./extraction-pipeline.md) — core extract() flow the bindings wrap.
- [project-lifecycle](./project-lifecycle.md) — Project contract.
- [publish-namespace](./publish-namespace.md) — naming rules for both bindings.
