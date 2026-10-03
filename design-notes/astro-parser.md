# Astro parser

## Summary

Panda reads `.astro` files with its own Astro tokenizer and lowers them into a JavaScript program for Oxc, at the same
byte offsets. Today a hand-written adapter blanks out everything except the frontmatter and `{…}` expressions, then
hopes the rest parses as TSX. Any Astro syntax that isn't JSX fails the parse: shorthand attributes, HTML comments,
unclosed void tags, `<` in text, directive names, raw-text elements. When that happens the file emits no styles. The
goal is parity with Astro: every file Astro's own parser accepts lowers to a clean program, with the same element,
attribute and expression boundaries Astro finds.

## Evidence

| Input set                                                            | Files | 2.1.1 fails | Fork-based reference |
| -------------------------------------------------------------------- | ----- | ----------- | -------------------- |
| Every `.astro` input from compiler-rs's three test suites (accepted) | 2,090 | not run     | 0                    |
| `withastro/astro@4c1470a` + `withastro/starlight@e45162c` (accepted) | 1,682 | 15          | 0                    |
| Sage's curated cases from Astro's test suites                        | 89    | 18          | —                    |

- Astro 7 parses `.astro` with `@astrojs/compiler-rs`, whose parser is a fork of Oxc (`withastro/oxc`, rev
  `8bb526fc0c20beb4649b223d3ac39851505caa5a`, Oxc 0.115). That parser defines what valid Astro is.
- A lowering built on the fork's AST (the reference, below) parses cleanly in Oxc 0.130 for all 3,772 accepted inputs.
  It also keeps every byte offset across all 4,323 inputs. So the lowering format is proven. The open question is only
  who finds the boundaries.
- The Svelte and Vue adapters share two of the bug classes. One is `<!-- <script> -->` before a TypeScript script. The
  other is a brace matcher with no regex or template-nesting state.

## Approaches considered

| Approach                                              | Verdict                                                                                                                                                                     |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Patch the existing adapter                            | Rejected. Its scanners share no context, so each fix finds the next gap.                                                                                                    |
| Depend on the `withastro/oxc` fork at runtime         | Rejected. Git-only dependency on Oxc 0.115, a second parser in every binary (+0.86 MB), and Panda tied to Astro's pin. It is kept as a test-only reference instead (below). |
| Vendor `astro2tsx` or print TSX from a tree           | Rejected. Biome's parsers come from git, and printing TSX shifts byte offsets, so the Vite transform would need a source map.                                               |
| Call `@astrojs/compiler-rs` from the JS host          | Rejected. A native dependency in the host, and nothing for Rust-only extraction or the wasm build.                                                                          |
| **Panda-owned tokenizer that ports the fork's rules** | **Chosen.** No dependencies, same offsets, and parity checked against the fork on every corpus input. The design follows Sage's research (one pass, modes, lowering to JS). |

## Architecture

```
.astro source
   │
   ▼
pandacss_astro (no dependencies)
   frontmatter::scan  ── fence scan, ported byte for byte from the fork
   js::Lexer          ── JS tokens: strings, templates with ${} nesting, comments, regex vs division
   template::parse    ── child lexer + JS lexer taking turns, like the fork → small tree
   lower              ── tree → canvas (same-offset JS) + elements
   │
   ▼
pandacss_extractor (Oxc 0.130, visitors unchanged)
   AdaptedSource(Astro) ─▶ canvas ; template_styles ─▶ elements ; diagnostics ─▶ tokenizer + canvas parse
```

`pandacss_astro` is a Tier 0 crate with no dependencies. Its public API:

```rust
pub fn lower(source: &str) -> AstroDocument;
pub struct AstroDocument { pub canvas: String, pub elements: Vec<AstroElement>, pub diagnostics: Vec<AstroDiagnostic> }
pub struct AstroElement { pub name: Range<u32>, pub opening: Range<u32>, pub attributes: Vec<AstroAttribute> }
pub struct AstroAttribute { pub name: Option<Range<u32>>, pub value: AstroAttributeValue }
pub enum AstroAttributeValue { Boolean, Static(Range<u32>), Expression(Range<u32>), Spread(Range<u32>), Empty }
pub struct AstroDiagnostic { pub message: String, pub span: Option<Range<u32>> }
pub mod js; // the JS lexer, also used by the Svelte and Vue adapters
```

### Offset invariant

Every canvas byte below `source.len()` is one of:

- copied from the source;
- blanked to a space, with newlines kept;
- one byte of `, ; [ ]` written over a non-line-break byte.

One `]` may be appended after `source.len()`. No offset in the source moves, so the extractor's spans, the transform's
span-based rewrites, and the scope and cross-file code that slice the source by span all keep working. This follows the
byte-offset rule in [hooks](./hooks.md#source-spans): no position map. Line breaks are never overwritten. Brackets go on
the first and last non-line-break byte of a range.

### Tokenizer

The fork reads `.astro` with three readers. The child lexer reads template text, `<`, `{` and `}`. The JS lexer reads
tag names, attribute boundaries and everything inside `{…}`. Byte scanners read the fences, raw text, scripts and
comments. Which reader takes the _next_ token decides the boundaries, so the tokenizer models the same switch instead of
a single cursor. `crates/pandacss_astro/FORK_RULES.md` records the exact rules, with fork file:line references and
verified examples. In outline:

- **Frontmatter.** The opening fence is the first `---` before any `<`, `{` or `}`. The closing fence is found by the
  fork's byte state machine: quotes, templates without `${}` tracking, comments, and regex chosen by a one-byte
  previous-token flag. It is ported as-is, including its coarse cases. An unclosed fence means no frontmatter. Code may
  share the fence lines.
- **Template children.** A `<` starts markup only before an ASCII letter, `/`, `>` or `!`. Otherwise it is text. At the
  top level, `</…>` ends the body silently. `<!--…-->` is a comment, and `<!…>` is a doctype.
- **Tags.** Names are JS identifiers joined by `-`, with optional `.member`. `:` is not a name character. Attribute
  names take any bytes up to `= > / { } < space \t \n \r`. Values are quoted, unquoted, a backtick template, `{expr}`,
  or an element. `{id}` is a shorthand, `{expr}` an expression shorthand, `{...x}` a spread, and `{}` is dropped. Void
  elements close without `/`. There is no implicit closing.
- **Raw text.** Only `<style>` and elements with `is:raw` are raw. Their content runs to the first `</name`. Only
  `<math>` turns braces into text. `title`, `textarea` and `iframe` are normal markup, as in the fork.
- **Scripts.** `<script>` content runs to the first `</script` and is blanked.
- **Expressions.** The JS lexer tokenizes up to the matching `}`. A `<` in operand position starts markup, decided by
  the previous token with a small bracket stack: control parens, blocks versus objects, type annotations. TS generic
  arrows (`<T,>`, `<T extends U>`) are excluded. A container whose first token is `<` takes the markup-first path, and
  its children are read as template children. Sibling elements group into an implicit fragment exactly where the fork
  groups them.
- **Fatal conditions.** Where the fork stops parsing (an unclosed element, a stray `}` inside an element, `{a b}`, and
  the others in `FORK_RULES.md`), the tokenizer records an `AstroDiagnostic`. It keeps the earlier top-level siblings
  and blanks the rest. It never panics.

The tokenizer builds a small tree: elements, fragments, expressions with the markup found inside them, attributes, and
the extents of text, comments and scripts. The lowering walks that tree with the same rules as the reference. Parity
therefore means the trees match, and the reference tool measures that.

### Lowering

Elements become array literals of their expressions. JS stays where it is.

| Node                                                           | Canvas                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Content before the opening fence, the fences                   | Blank. The closing fence's first byte becomes `;` and the next `[`, opening the template array.        |
| Frontmatter                                                    | Copied as-is. Top-level `return` stays allowed.                                                        |
| No frontmatter                                                 | The first non-line-break byte of the template becomes `[`.                                             |
| End of file                                                    | `]` appended when an array was opened.                                                                 |
| Text, comments, doctype, scripts, raw text                     | Blank.                                                                                                 |
| Element or fragment whose parent is JS                         | `[` on its first non-line-break byte, `]` on its last. Descendant markup flattens into the same array. |
| Element whose parent is markup                                 | Tag syntax blank. Its expressions join the enclosing array.                                            |
| Expression (child, attribute value, shorthand, backtick value) | Copied. A `,` goes on the nearest preceding non-space byte (`{`, `=`, or a skipped comment).           |
| Spread                                                         | Copied from its `...`, with the same leading `,`.                                                      |
| Static value, boolean attribute, attribute name, `{}`          | Blank. Static values live in `AstroElement`.                                                           |

```astro
{show && (
  <Panel {id}>
    <p class={css({ color: 'orange' })}>inside</p>
  </Panel>
)}
```

lowers to (trailing spaces trimmed; every line keeps its source length)

```js
;[show && [, id, css({ color: 'orange' })]]
```

### Component elements

`template_styles` reads `AstroDocument.elements` instead of scanning the markup string. Expression values resolve
through the existing `TemplateLiteralIndex` at the attribute's expression span on the canvas. Every Astro element goes
through one path, including components nested inside expressions, and `pandacss_transform` already treats those
`FrameworkTemplate` records like JSX elements.

### Diagnostics

For `.astro`, the file's parse diagnostics are the tokenizer's diagnostics plus any Oxc errors from parsing the canvas.
When the tokenizer accepts a file, the canvas is meant to parse cleanly. A canvas error then points at a tokenizer
divergence and is still reported, so styles are never dropped silently.

### Svelte and Vue

They keep their adapters but gain two of the tokenizer's pieces:

- `tag_blocks` skips `<!-- … -->`, so a tag name in a comment can't open a block.
- `find_matching_brace` uses `pandacss_astro::js::Lexer`, so `}` inside a regex or a nested template no longer ends an
  expression.

## Parity reference

`crates/pandacss_astro/reference/` is a standalone Cargo package with its own `[workspace]`, so it never builds with
Panda. It depends on the fork and contains the AST-based lowering. That lowering is the earlier design's implementation,
with the fork's frontmatter `program.span` replaced by the fence scan's end. Run by hand, it writes
`tests/corpus/oracle.tsv`, one line per corpus file:

```
<path>\t<accepted|rejected>\t<fnv64 of the canvas>\t<fnv64 of the element list>
```

The conformance test runs `pandacss_astro::lower` on every corpus file:

- **Accepted inputs:** no tokenizer diagnostics, and the canvas and element hashes equal the reference.
- **Rejected inputs:** no panic, offsets kept, and at least one diagnostic.
- **Exceptions:** listed in `tests/corpus/deviations.tsv`, each with a reason. Every line there is a known parity gap.

## Corpus

- `tests/corpus/compiler-rs/`: every `.astro` input that compiler-rs's fork-parser, Rust and JS test suites pass to a
  parser (2,636 files, from `harvest.sh`).
- `tests/corpus/real/`: every `.astro` file in `withastro/astro@4c1470a` and `withastro/starlight@e45162c` (1,687 files,
  812 KB), the pinned commits from Sage's research.
- `LICENSE` and `SOURCE` record the MIT notices and revisions.

Bumps are manual. When a new `@astrojs/compiler-rs` release moves its fork pin, re-harvest, regenerate `oracle.tsv` with
the reference at the new pin, and review the diff.

## Performance

The tokenizer is one pass over the file, plus Oxc's parse of a mostly blank canvas. `bench/src/bin/astro_extract.rs`
times `extract()` over the corpus. The old adapter measured 6.94 ms per pass over the 2,636 compiler-rs inputs. The
switch must not be slower without a recorded decision, per [performance budget](./performance-budget.md).

## Testing

| Layer        | Where                                                | What                                                                                                                           |
| ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| JS lexer     | `crates/pandacss_astro/tests/js.rs`                  | Token boundaries: strings, templates with nested `${}`, comments, regex versus division, the `<` operand rule, generic arrows. |
| Frontmatter  | `crates/pandacss_astro/tests/frontmatter.rs`         | Every example in `FORK_RULES.md` §1.                                                                                           |
| Lowering     | `crates/pandacss_astro/tests/lower.rs`               | One canvas snapshot per lowering row and syntax-spec section, CRLF, multi-byte text, unclosed fences.                          |
| Parity       | `crates/pandacss_astro/tests/corpus.rs`              | Every corpus file against `oracle.tsv`; offsets on every file; every markup-free expression copied verbatim.                   |
| Extraction   | `crates/pandacss_extractor/tests/framework_astro.rs` | The three issue repros, Sage's named cases, component props, and every accepted corpus file extracting without warnings.       |
| Transform    | `crates/pandacss_transform/tests/sfc.rs`             | `css()` rewrites inside nested markup, siblings, backtick values, raw text, CRLF and non-ASCII, byte for byte.                 |
| Svelte / Vue | `framework_svelte.rs`, `framework_vue.rs`            | `<script>` in a comment; `}` inside a regex in an expression.                                                                  |
| End to end   | `sandbox/astro`                                      | `astro build` accepts the page, and `panda cssgen` emits its styles.                                                           |

## Rollout

1. Reference package, real-code corpus, `oracle.tsv`, `FORK_RULES.md`.
2. JS lexer and frontmatter scanner.
3. Template tokenizer and lowering on the tree, with the fork dependency removed and the parity test passing.
4. Extractor switch; delete `astro_adapter.rs` and the Astro string scan. Fixes #3916, #3917 and #3918.
5. Svelte and Vue: comment skip and lexer-based brace matching.
6. Sandbox proof, bench, docs and changeset.

## Unresolved Questions

- **Client scripts.** Astro hands each `<script>` to Vite as a virtual module, which the Vite plugin may already
  extract. The CLI and PostCSS paths only see the `.astro` file. Confirm in a sandbox before extracting scripts.
- **Quirks without corpus coverage.** Some of the fork's behaviour is recovery from what is really a mistake: the token
  dropped after a nested `{}` in a markup-first container, and `{z}` turning into text right after `</math>`. These are
  ported when cheap and otherwise listed in `deviations.tsv`. Sage's comment-before-fence test expects a frontmatter
  that the fork does not find. Parity follows the fork.
- **Error isolation.** One bad expression still costs the whole file's later styles. Per-expression recovery is out of
  scope.
- **Nightly differential against fresh Astro releases** (Sage's Suite G) is a follow-up. The committed real-code corpus
  covers the pinned commits.

## Related

- [Extraction pipeline](./extraction-pipeline.md)
- [Hooks](./hooks.md) (source spans)
- [Crate layering](./crate-layering.md)
- [Performance budget](./performance-budget.md)
- [Rust testing](./rust-testing.md)
