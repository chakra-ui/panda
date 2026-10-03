# Astro parser

## Summary

Panda reads `.astro` files with Astro's own parser and lowers the result into a JavaScript program for Oxc. Today a
hand-written adapter blanks out everything except the frontmatter and `{…}` expressions, then hopes the rest parses as
TSX. Any Astro syntax that isn't JSX (shorthand attributes, HTML comments, unclosed void tags, `<` in text, directive
names, raw-text elements) fails the parse, and the file emits no styles. The goal is full Astro syntax support: if Astro
builds the file, Panda extracts from it.

## Evidence

Probe of 23 cases (the three reported issues, every rule in Astro's syntax spec, and two Svelte/Vue cases); the Astro
cases are kept in `sandbox/astro-parser-spike`.

| Parser                                | Astro cases parsed cleanly |
| ------------------------------------- | -------------------------- |
| Current adapter (`astro_adapter.rs`)  | 3 of 21                    |
| Astro's parser, `SourceType::astro()` | 21 of 21                   |

- Astro 7 depends on `@astrojs/compiler-rs`. Its parser is a fork of Oxc (`withastro/oxc`, `oxc_parser` feature
  `astro`), pinned by git revision in compiler-rs's `Cargo.toml`. That parser defines what valid Astro is.
- The fork is on Oxc 0.115; Panda is on 0.130. Astro mode is not in upstream Oxc.
- Both versions link into one binary (renamed git dependencies), build for `wasm32-unknown-unknown`, and add about 0.86
  MB to a release binary.
- `SourceType::tsx()` rejects every case with markup inside `{…}`. Use `SourceType::astro()`, as compiler-rs does.
- The Svelte and Vue adapters share one of the three bugs: `<!-- <script> -->` before a TypeScript script fails the
  parse, because `tag_blocks` doesn't skip comments.

## Approaches considered

| Approach                                    | Verdict                                                                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Patch the hand-written adapter              | Rejected. Re-implements Astro's grammar by hand; each fix finds the next gap.                                                                               |
| Move the whole engine onto the fork         | Rejected. Downgrades Oxc 0.130 → 0.115 and ties every crate to a git pin.                                                                                   |
| Vendor `astro2tsx`                          | Rejected. Pulls Biome's HTML and JS parsers from git, and its TSX output shifts byte offsets.                                                               |
| Use `@astrojs/compiler-rs` from npm         | Rejected. Runs in JS, not in the Rust engine, and `parse()` returns ESTree JSON, not Oxc nodes.                                                             |
| **Fork parser as a front end, lower to JS** | **Chosen.** Astro's grammar, Panda's Oxc, no offset changes. If Astro mode lands upstream in Oxc, the lowering is deleted and the extractor walks the tree. |

## Architecture

```
.astro source
   │
   ▼
pandacss_astro  (only crate that sees the fork)
   parse with withastro/oxc, SourceType::astro()
   walk AstroRoot ──▶ AstroDocument
                        canvas      JS program, same byte offsets as the source
                        elements    tag name + attributes with spans
                        scripts     client <script> content ranges
                        diagnostics fork parse errors, original offsets
   │
   ▼
pandacss_extractor  (Oxc 0.130, unchanged visitors)
   adapt_source(Astro)   ─▶ canvas
   template_styles       ─▶ elements  (replaces the string scan)
   parse diagnostics     ─▶ fork diagnostics
```

### Crate boundary

`crates/pandacss_astro` is a Tier 1 parsing crate. It depends on the fork crates and nothing in Panda. Its public API
has no fork types: byte ranges, strings and small enums only. `pandacss_extractor` is its only dependent. Fork
dependencies are declared once in the workspace `Cargo.toml` under renamed keys (`astro_oxc_parser`, `astro_oxc_ast`, …)
so they can't be confused with Panda's Oxc.

```rust
pub struct AstroDocument {
    pub canvas: String,
    pub elements: Vec<AstroElement>,
    pub scripts: Vec<AstroScript>,
    pub diagnostics: Vec<AstroDiagnostic>,
}

pub struct AstroElement {
    pub name: Range<u32>,
    pub attributes: Vec<AstroAttribute>,
    pub self_closing: bool,
}

pub enum AstroAttributeValue {
    Boolean,
    Static { value: Range<u32> },
    Expression { expression: Range<u32> },
    Shorthand { expression: Range<u32> },
    Spread { expression: Range<u32> },
    TemplateLiteral { expression: Range<u32> },
    Empty,
}
```

### Offset invariant

Every byte of the canvas below `source.len()` is either copied from the source, blanked to a space (newlines kept), or
replaced by one byte of punctuation. Closing punctuation may be appended after `source.len()`. No offset in the source
moves, so the extractor's spans, the transform's span-based rewrites, and the scope and cross-file code that slice the
source by span all keep working. This follows the byte-offset rule in [hooks](./hooks.md#source-spans): no position map.

### Lowering

The extractor needs two things from the template: every JS expression, in a scope that sees the frontmatter and any
enclosing arrow parameters, and the attributes of component elements. Markup itself is never parsed by Oxc 0.130.
Elements become array literals of their expressions; JS stays where it is.

| Astro node                                                                 | Canvas                                                                                         |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Content before the opening fence, the fences                               | Blank. The closing fence's first byte becomes `;`, the next `[`, opening the template array.   |
| Frontmatter                                                                | Copied as-is. Top-level `return` stays allowed (`parse_options_for`).                          |
| No frontmatter                                                             | The template's first byte becomes `[`.                                                         |
| End of file                                                                | `]` appended.                                                                                  |
| Text, HTML comments, doctype                                               | Blank.                                                                                         |
| `<style>`, `<script>`, `is:raw`, `<math>` and other no-expression elements | Blank, including their content.                                                                |
| Element or fragment whose parent is a JS expression                        | `<` becomes `[`, its last `>` becomes `]`. Descendant markup is flattened into the same array. |
| Element whose parent is markup                                             | Tag syntax blank. Its expressions join the enclosing array.                                    |
| `{expr}` child or attribute value                                          | `{` becomes `,`, `}` becomes a space, `expr` copied.                                           |
| `{...expr}` spread                                                         | `{` becomes `,`, the spread copied (array spread), `}` becomes a space.                        |
| `{id}` shorthand attribute                                                 | Same as `{expr}`.                                                                              |
| `` attr=`…${x}` `` template-literal attribute                              | `=` becomes `,`, the literal copied, the name blank.                                           |
| Quoted or unquoted static value, boolean attribute, attribute name         | Blank. The value lives in `AstroElement`.                                                      |
| `{}` or `{/* comment */}`                                                  | Braces blank, comment kept.                                                                    |

```astro
---
const show = true
---
{show && (
  <Panel {id}>
    <p class={css({ color: 'orange' })}>inside</p>
  </Panel>
)}
```

lowers to (trailing spaces trimmed; every line keeps its source length)

```js
const show = true
;[, show && [, id, css({ color: 'orange' })]]
```

`css()` keeps its span, `id` and the frontmatter bindings stay in scope, and an arrow parameter like `item` in
`{items.map(item => <li class={css(item.x)} />)}` stays inside its arrow because the element became an array inside the
arrow body.

The leading `,` on each expression keeps adjacent expressions from merging (`{a}{b}` must not become the call `(a)(b)`,
the hazard in the current adapter). A leading comma right after `[` is an array hole, which is valid.

### Component elements

`template_styles` keeps its job: it turns component attributes into `ExtractedJsx` with
`JsxSourceKind::FrameworkTemplate`. For Astro it reads `AstroDocument.elements` instead of scanning the markup string.
Expression values resolve through the existing `TemplateLiteralIndex`, which looks up the Oxc 0.130 node at the
attribute's expression span on the canvas. Shorthand `{color}` on `<Box>` becomes the style prop `color` with the
expression `color`. Unquoted `color=red` becomes the static string `"red"`.

Components inside expressions take this path too, so every Astro element goes through one extractor instead of two (the
string scan for the top level, Oxc's JSX visitor inside expressions). `pandacss_transform` already treats
`FrameworkTemplate` and `Element` the same.

### Client scripts

A bare `<script>` is TypeScript in Astro and is bundled. Each extractable script (no attributes, or `type="module"`; not
`is:inline`) gets its own canvas, blank except for its content, and is parsed as a separate TS module so its imports
don't collide with the frontmatter. Results merge into the file's extraction. This is phase 2; see the unresolved
questions.

### Diagnostics

Fork parse errors map to the existing `js_parse_error` diagnostic with original-source spans. The canvas must parse with
zero errors by construction. A canvas error is a lowering bug: the conformance suite fails on it, and a `debug_assert`
catches it in development. When the fork reports `panicked`, Panda still lowers the partial tree and emits the
diagnostic, matching the [parse-error contract](./extraction-pipeline.md#parse-error-contract).

### Svelte and Vue

They keep their adapters. `tag_blocks` learns to skip `<!-- … -->` so a tag name in a comment can't open a block. This
fixes the Svelte and Vue form of the `<script>`-in-a-comment bug.

## Dependency management

- Workspace `Cargo.toml` pins the fork to the revision compiler-rs uses in its latest release.
- `deny.toml` adds `allow-git = ["https://github.com/withastro/oxc"]`; `unknown-git` stays `deny`.
- Renovate tracks the `@astrojs/compiler-rs` release; each bump moves the pin and re-runs the conformance suite.
- `--locked` builds, NAPI, and `compiler-wasm` (`wasm32-unknown-unknown`) all build from the same lockfile entry.

## Performance

Each `.astro` file is parsed twice: once by the fork, once by Oxc 0.130 on the canvas. The canvas is mostly blank, so
the second parse is cheap. A benchmark over the Astro fixtures in `bench/` compares the old adapter, before the default
flips, per [performance budget](./performance-budget.md).

## Testing

| Layer              | Where                                                | What                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lowering           | `crates/pandacss_astro/tests/`                       | One inline canvas snapshot per row of the lowering table and per section of Astro's syntax spec.                                                                                                        |
| Invariants         | same                                                 | For every fixture: canvas length is `source.len()` plus the tail; every copied byte equals the source byte; Oxc 0.130 parses the canvas with zero errors.                                               |
| Conformance corpus | `crates/pandacss_astro/tests/fixtures/compiler-rs/`  | The `.astro` fixtures from compiler-rs (`astro_codegen` and `astro2tsx`, about 480 files, MIT, `LICENSE` and source revision recorded). Every fixture the fork parses cleanly must pass the invariants. |
| Extraction         | `crates/pandacss_extractor/tests/framework_astro.rs` | The three issue repros, plus one style snapshot per syntax-spec section: calls, component props (shorthand, unquoted, template literal), nested markup in expressions, arrow scopes, scripts.           |
| Transform          | `crates/pandacss_transform/tests/sfc.rs`             | `css()` rewrites inside nested markup in expressions; dead-import cleanup; spans unchanged.                                                                                                             |
| Svelte / Vue       | `framework_svelte.rs`, `framework_vue.rs`            | `<!-- <script> -->` before a TypeScript script.                                                                                                                                                         |
| End to end         | `sandbox/astro-*`                                    | A real Astro project built with the CLI and the Vite plugin, showing the reported styles in the output CSS.                                                                                             |

## Rollout

1. `pandacss_astro` with lowering, invariants and the conformance corpus. No extractor change yet.
2. Switch `adapt_source` and `template_styles` to `AstroDocument`; delete `astro_adapter.rs` and the Astro string scan.
   Fixes #3916, #3917 and #3918.
3. `tag_blocks` comment skip for Svelte and Vue.
4. Client scripts.

## Unresolved Questions

- **Client scripts in the Vite path.** Astro hands each `<script>` to Vite as a virtual module, which the Vite plugin
  may already extract. The CLI and PostCSS paths only see the `.astro` file. Confirm with a sandbox before phase 4, so
  scripts aren't extracted twice.
- **Pin cadence.** Follow compiler-rs's pinned revision (what Astro users run), or the fork's newest fix branch?
  Default: compiler-rs's pin.
- **Upstream Oxc.** Ask the Astro team whether Astro mode is headed for upstream Oxc. If it lands at Panda's Oxc
  version, drop the lowering and walk `AstroRoot` directly.

## Related

- [Extraction pipeline](./extraction-pipeline.md)
- [Hooks](./hooks.md) (source spans)
- [Crate layering](./crate-layering.md)
- [Performance budget](./performance-budget.md)
- [Rust testing](./rust-testing.md)
