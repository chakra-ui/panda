# MDX extraction

Panda previously sent raw `.mdx` documents to Oxc as TSX, so Markdown could prevent live styles from being extracted.
This prototype addresses [issue #3948](https://github.com/chakra-ui/panda/issues/3948) through the existing container
adapter in `pandacss_sfc`. Files already covered by `include` require no additional configuration.

## Extraction contract

The adapter retains module imports/exports, JavaScript expressions, and component opening-tag attributes. Existing
import matching, literal evaluation, JSX rules, encoding, and CSS generation then apply. Fenced and inline code,
frontmatter, escapes, and link destinations are excluded. Code examples must never emit styles.

```mermaid
flowchart LR
    MDX[MDX source] --> Scan[Scan Markdown exclusions and JSX attributes]
    Scan --> Canvas[Same-offset JavaScript canvas]
    Scan --> Attrs[Attribute spans]
    Canvas --> Oxc[One Oxc parse and literal evaluation]
    Oxc --> Collect[Existing style collection]
    Attrs --> Collect
    Collect --> CSS[Existing encoding and CSS emission]
```

Byte offsets stay tied to the original source, including UTF-8 and CRLF. Expressions become entries in a synthetic
array, avoiding extra scopes and preserving identifier lookup. Arrays split around module declarations. A separator
after a semicolonless export uses an existing blank byte; in the tightest case it replaces a newline. Diagnostics
therefore resolve their line/column against the original document rather than the canvas.

Opening tags use the existing Astro attribute-span representation, exported under container-neutral aliases. Embedded
JSX inside JavaScript remains JSX for Oxc. Attribute expressions use the shared parse's literal cache. A missing or
dynamic value never triggers a second parse of the document. Quoted attributes decode XML/numeric entities using Oxc's
existing entity table.

MDX source rewriting deliberately bails with the source unchanged. Rewriting synthetic arrays back into an MDX document
needs a separate contract and tests; extraction and CSS generation do not depend on it.

## Cost and design choice

An initial full Markdown AST prototype used `markdown-rs` and embedded-JavaScript validation callbacks. It passed the
initial extraction tests, but allocating a Markdown tree and repeatedly parsing expressions cost substantially more time
and memory than TSX. The final adapter adds no runtime dependency and performs no JavaScript parsing itself.

The scanner stores source spans, its canvas, and open-tag state. Inline backtick runs are indexed lazily on the first
inline-code encounter; common delimiter lengths use a small array. Failed image-label searches are cached and tag
lookahead is bounded to avoid repeated suffix scans. Multiline exports reuse the shared JavaScript lexer and brace
matcher. Normal `.ts`/`.tsx` sources continue through their existing path.

See the [benchmark report](./bench/mdx-3948.md) for measured latency, allocations, watch behavior, and acceptance gates.
These gates are local regression criteria, not universal latency guarantees.

## Validation and remaining scope

The checked-in parity corpus compares named JSX elements and JavaScript call spans against `@mdx-js/mdx` 3.1.1. Run
`node bench/scripts/mdx-parity.mjs` from the repository root to regenerate it using the installed website dependency.
The Rust test can read a larger generated corpus via `PANDA_MDX_CORPUS`. The 151 repository MDX documents also matched
the official parser in the local check. Extraction tests cover static/dynamic attributes, spreads, imports, exports,
comments, entities, diagnostics, and original offsets; compiler tests cover CSS generation and watch replacement.

This is an extraction adapter, not a complete MDX validator or compiler. It does not execute remark/rehype plugins or
custom syntax transformations. Parity is checked for extraction boundaries rather than every Markdown AST node. Before
shipping, expand coverage for third-party documentation corpora, reference links/images, entity sets, and
plugin-transformed syntax. Existing CSS output snapshots must remain unchanged.

## Related

- [Extraction pipeline](./extraction-pipeline.md)
- [Astro parser](./astro-parser.md)
- [Literal evaluator](./literal-evaluator.md)
- [Project lifecycle](./project-lifecycle.md)
