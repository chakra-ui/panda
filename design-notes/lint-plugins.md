# Panda Lint Plugins

## Summary

Panda should ship ESLint and Oxlint plugins on top of shared internal lint utilities.

The shared utilities should load config with `@pandacss/config`, create a long-lived compiler with
`@pandacss/compiler`, index `compiler.spec()`, and inspect source with `compiler.inspectFileSource()`. ESLint and
Oxlint should keep their own ASTs for traversal, reporting, and fixes. Panda should provide the inspection data that
describes what the source means to Panda.

```txt
source text
  ├─ ESLint/Oxlint parser → AST nodes, ranges, reports, fixes
  └─ Panda parser         → imports, calls, JSX, usages, diagnostics
```

Do not rebuild Panda metadata with v1 `@pandacss/generator`. Do not require TypeScript parser services to detect Panda
components.

## Research

### Oxlint

Oxlint supports JavaScript plugins through `jsPlugins`. The plugin specifier can point to a local file or npm package.
Rule ids are configured under `rules`, and plugin-wide options can live in `settings`.

JS plugins are still alpha, but the API is ESLint v9 compatible. `@oxlint/plugins` adds helpers such as
`eslintCompatPlugin(...)` and `createOnce(context)`.

Relevant docs:

- <https://oxc.rs/docs/guide/usage/linter/js-plugins.html>
- <https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html>
- <https://oxc.rs/docs/guide/usage/linter/config.html>

### Existing public plugin

There is already a public Oxlint fork:

- GitHub: <https://github.com/azu/eslint-plugin-panda-oxc>
- npm: <https://www.npmjs.com/package/@azu/eslint-plugin-panda-oxc>

It mirrors the v1 Panda ESLint rules and asks users to generate a Panda data JSON file before linting:

```ts
import { createPandaJSON } from '@azu/eslint-plugin-panda-oxc'

const pandaDataPath = await createPandaJSON('./panda.config.ts')
```

Oxlint then reads it from `settings['@pandacss/configPath']`.

This proves the performance shape: compute Panda metadata once, then make rule visitors cheap. The v2 version should
keep that shape, but generate inspection data from `loadConfig()`, `createCompilerFromSnapshot()`, `compiler.spec()`,
`compiler.inspectFileSource()`, and `compiler.buildInfo`.

### Prior art

`@pandacss/eslint-plugin` gives us the rule surface. `eslint-plugin-chakra-ui` gives us useful patterns for small
fixable JSX rules: prop ordering, prop shorthand, and replacing generic components with specific ones. Panda should copy
the rule shape, not Chakra's TypeScript type-checker dependency.

## Packages

Use two public packages:

```txt
@pandacss/eslint-plugin
@pandacss/oxlint-plugin
```

Keep the shared implementation as internal modules, not a public package:

```txt
packages/eslint-plugin/src/core/*
packages/eslint-plugin/src/rules/*
packages/oxlint-plugin/src/*
```

`packages/eslint-plugin/src/core/*` owns config loading, compiler construction, spec indexing, build-info hydration,
per-file inspection, and shared range helpers. `@pandacss/oxlint-plugin` can reuse those modules inside the workspace,
or copy a small adapter layer if package boundaries make direct sharing awkward. Do not expose a separate public package
until there is clear external demand.

## Shared Project Metadata

Build one metadata object per config path:

```ts
import { loadConfig } from '@pandacss/config'
import { createCompilerFromSnapshot } from '@pandacss/compiler'

const loaded = await loadConfig({ cwd, file: configPath, trackSources: true })
const compiler = createCompilerFromSnapshot(
  {
    config: loaded.config,
    callbacks: loaded.callbacks,
    hooks: loaded.hooks,
  },
  { crossFile: true },
)
const spec = compiler.spec()
```

Index `spec` into sets/maps:

- token paths and deprecated token paths
- color token paths
- utility properties and token categories
- shorthand ↔ longhand maps
- property order
- normalized import map
- JSX factory, pattern names, recipe names, and variant keys

Cache by `(cwd, configPath)`. Invalidate in editor/watch mode when any `loadConfig(...).dependencies` entry or
build-info file changes.

Settings lookup:

1. `settings.panda.configPath`
2. `settings['@pandacss/configPath']` as a migration alias
3. nearest discovered Panda config from the linted file

`compiler.spec()` is already close to the right linting shape: it exposes tokens, deprecated tokens, utilities,
shorthands, property order, JSX factory, and the normalized import map. The main improvement is to make recipes and
patterns less opaque for lint rules by adding typed projections for recipe variant keys, slot names, and pattern props.

## File Inspection API

`inspectFileSource` is the lint boundary. It is already a tooling API, so avoid a `target: "lint"` mode. Make the default
shape useful for lint, formatting, and IDE features.

Current shape:

```ts
interface FileInspectionResult {
  usages: UsageSite[]
  diagnostics: Diagnostic[]
}
```

Proposed shape:

```ts
interface FileInspectionResult {
  diagnostics: Diagnostic[]
  imports: ImportRecord[]
  matched: MatchedImport[]
  calls: ExtractedCall[]
  jsx: ExtractedJsx[]
  usages: UsageSite[]
  tokenRefs: TokenRef[]
  componentEntries: ComponentEntryRef[]
  styleEntries: StyleEntryRef[]
}

interface TokenRef {
  path: string
  span: Span
  range: SourceRange
  resolved: boolean
  needsCssVar: boolean
  category?: string
  deprecated?: boolean
}

interface StyleEntryRef {
  name: string
  kind: StyleEntryKind
  syntax: StyleEntrySyntax
  origin: StyleEntryOrigin
  owner?: StyleEntryOwner
  span: Span
  keySpan?: Span
  valueSpan?: Span
  path: string[]
  canonicalName?: string
  shorthandOf?: string
  sourceValue?: StyleSourceValue
  resolvedValue?: unknown
  fixable: 'safe' | 'key-only' | 'report-only'
}

interface ComponentEntryRef {
  name: string
  kind: 'jsx-component' | 'recipe-component' | 'slot-recipe-component' | 'pattern-component'
  syntax: 'jsx-component'
  span: Span
  recipe?: string
  slot?: string
}

interface StyleEntryOwner {
  kind: 'recipe' | 'slot-recipe' | 'pattern' | 'component'
  name: string
  slot?: string
}

type StyleEntryKind = 'utility' | 'condition' | 'selector' | 'recipe-variant' | 'pattern-prop' | 'unknown'
type StyleEntrySyntax = 'css-call' | 'jsx-prop' | 'jsx-css-prop' | 'recipe-call' | 'pattern-call' | 'template-style'
type StyleEntryOrigin = 'local' | 'spread' | 'cross-file' | 'computed' | 'generated'

type StyleSourceValue =
  | { kind: 'literal'; value: unknown; span: Span }
  | { kind: 'array'; items: Array<StyleSourceValue | { kind: 'hole' | 'null-slot'; span?: Span }> }
  | { kind: 'object'; entries: StyleEntryRef[] }
  | { kind: 'conditional'; span: Span; testSpan?: Span; branches: StyleSourceBranch[] }
  | { kind: 'dynamic'; span: Span; reason: 'identifier' | 'call' | 'unsupported' }

interface StyleSourceBranch {
  label: 'consequent' | 'alternate' | 'truthy' | 'fallback' | 'unknown'
  span: Span
  value: StyleSourceValue
}
```

Why add these fields:

- `imports` and `matched` let rules know which local names are Panda imports.
- `calls` lets rules map `css(...)`, `cva(...)`, `sva(...)`, pattern calls, and `token(...)`.
- `jsx` lets rules know which JSX tags and props Panda extracted.
- `tokenRefs` lets token rules report exact token references, including unresolved paths.
- `componentEntries` lets JSX rules report on matched component tags and recipe/pattern ownership.
- `styleEntries` lets style rules report exact keys and values instead of the enclosing call or JSX element.
- byte ranges let rules join Panda inspection data to ESLint/Oxlint AST nodes.

Keep `usages` as the high-level summary for reporting and editor features.

`kind` describes what the key means to Panda. `syntax` describes how it was written in source. `origin` describes where
the entry came from after extraction. For example, `color` is `kind: "utility"` whether it appears in `css({ color })`,
`<Box color="red" />`, or `<Box css={{ color: "red" }} />`; those cases differ by `syntax`.

Some of this is mostly plumbing from existing extractor output: calls, JSX, matched imports, diagnostics, and internal
`token_refs` already exist. Exact style entry ranges are different. The current folded `Literal::Object` stores keys and
values without source spans, so `styleEntries` needs either a span-aware inspection literal or a separate Oxc visitor
that emits lint references while reusing the same resolver and Panda classifiers.

Do not put the richer inspection model on the production build path. `parseFileSource()` and the lean extractor should
stay optimized for compilation. `inspectFileSource()` is the on-demand tooling boundary, so it can serialize more data
and do extra classification as long as lint adapters call it once per file and cache the result across rules.

The first implementation should derive as much as possible from the current extraction result. It can expose existing
imports, matched imports, calls, JSX, token refs, diagnostics, component entries, recipe ownership, and coarse
style-entry classification without a second parse. Exact `keySpan` / `valueSpan`, recursive `sourceValue`, and precise
`origin` are autofix-grade enhancements and can be added incrementally.

Keep a clear split between source provenance and normalized extraction output. `sourceValue` describes the written
expression for reports and safe fixes. `resolvedValue` mirrors Panda's folded output and may contain conservative unions
from ternaries, logical operators, spreads, responsive arrays, `css.raw`, cross-file constants, and computed keys. Do not
treat `resolvedValue.kind === "conditional"` as exact runtime control flow.

For example:

```ts
css({
  color: isError ? 'red' : { base: 'pink', _dark: 'red' },
})
```

should be one `color` style entry. Its `sourceValue` keeps the ternary tree and nested condition-map entries; its
`resolvedValue` matches Panda's extracted conditional branches:

```ts
{
  name: 'color',
  kind: 'utility',
  syntax: 'css-call',
  origin: 'local',
  sourceValue: {
    kind: 'conditional',
    branches: [
      { label: 'consequent', value: { kind: 'literal', value: 'red' } },
      {
        label: 'alternate',
        value: {
          kind: 'object',
          entries: [
            { name: 'base', kind: 'condition' },
            { name: '_dark', kind: 'condition' },
          ],
        },
      },
    ],
  },
  resolvedValue: {
    kind: 'conditional',
    branches: ['red', { base: 'pink', _dark: 'red' }],
  },
}
```

JSX recipe components need both layers. The component entry captures the tag-level recipe or pattern usage; style entries
capture prop-level keys after recipe ownership is known. Recipe variant props must be classified before utility props so
variant values such as `"ghost.white"` are not treated as utility token paths.

```tsx
<Action size="sm" color="red" />
```

```ts
{
  componentEntries: [
    { name: 'Action', kind: 'recipe-component', syntax: 'jsx-component', recipe: 'button' },
  ],
  styleEntries: [
    {
      name: 'size',
      kind: 'recipe-variant',
      syntax: 'jsx-prop',
      owner: { kind: 'recipe', name: 'button' },
    },
    {
      name: 'color',
      kind: 'utility',
      syntax: 'jsx-prop',
      owner: { kind: 'recipe', name: 'button' },
    },
  ],
}
```

Slot recipes carry the slot on both the component and prop entries:

```tsx
<Tabs.Root size="sm" padding="2px" />
```

```ts
{
  componentEntries: [
    {
      name: 'Tabs.Root',
      kind: 'slot-recipe-component',
      syntax: 'jsx-component',
      recipe: 'tabs',
      slot: 'root',
    },
  ],
  styleEntries: [
    {
      name: 'size',
      kind: 'recipe-variant',
      syntax: 'jsx-prop',
      owner: { kind: 'slot-recipe', name: 'tabs', slot: 'root' },
    },
    {
      name: 'padding',
      kind: 'utility',
      syntax: 'jsx-prop',
      owner: { kind: 'slot-recipe', name: 'tabs', slot: 'root' },
    },
  ],
}
```

Non-style component props should be omitted from `styleEntries` by default, not reported as unknown utilities.

## Parser Interaction

The linter parser remains the source of truth for reports and fixes. Panda is the source of truth for Panda semantics.

Per file:

```ts
function getPandaLintContext(context: RuleContext): PandaLintContext {
  const source = context.sourceCode.getText()
  const inspection = metadata.compiler.inspectFileSource(context.filename, source)
  const fileState = buildFileState(context.sourceCode.ast, metadata, inspection)
  return { inspection, fileState }
}
```

`PandaLintContext` should be cached by `(filename, sourceHash, configKey)` and shared by all Panda rules.

```ts
interface PandaLintContext {
  inspection: FileInspectionResult
  fileState: PandaFileState
}

interface PandaFileState {
  imports: ImportRecord[]
  pandaImports: MatchedImport[]
  localStyledFactories: Set<string>
  isSourceFile: boolean
}
```

Build range indexes from the inspection result:

```ts
const callsByRange = new RangeIndex(inspection.calls)
const jsxByRange = new RangeIndex(inspection.jsx)
const tokenRefsByRange = new RangeIndex(inspection.tokenRefs)
```

Rules can then combine AST nodes with Panda inspection data:

```ts
JSXAttribute(node) {
  if (!panda.fileState.isSourceFile) return
  if (!isPandaJsxProp(node, panda)) return
  // report with ESLint node and fixer
}
```

Most rules should not need exact node-to-inspection matching. Use Panda inspection data for target detection and
metadata, then ESLint nodes for fixes.

## Rule Target Detection

Rules only report on Panda-authored surfaces:

- Panda calls are calls whose local callee was matched through `inspection.imports`.
- JSX props are Panda props when the JSX tag appears in `inspection.jsx` or is a local styled factory.
- Style object keys are Panda properties when `spec.utilities.properties` contains the key after shorthand resolution.
- Recipe variant keys are not CSS properties and should be skipped by property-style rules.

Do not detect Panda components through TypeScript parser services.

## Adapter Design

### ESLint

`@pandacss/eslint-plugin` should target ESLint v9 flat config and keep `@pandacss/*` rule ids.

```ts
import panda from '@pandacss/eslint-plugin'

export default [
  panda.configs.recommended({
    configPath: './panda.config.ts',
  }),
]
```

Rules use normal `create(context)` visitors. The shared core handles metadata and `PandaLintContext` caching. Do not
require `@typescript-eslint/parser`; users can keep their parser.

### Oxlint

`@pandacss/oxlint-plugin` should be loaded through `jsPlugins` and document `panda/*` rule ids.

```ts
import { defineConfig } from 'oxlint'
import { configs as panda } from '@pandacss/oxlint-plugin'

export default defineConfig({
  extends: [panda.recommended()],
  settings: {
    panda: {
      configPath: './panda.config.ts',
    },
  },
})
```

Rules should use `createOnce`. If Oxlint needs sync entrypoints while config loading stays async, use a worker or
precomputed JSON. The worker returns one metadata object; rules must not query it per property.

## Rule Set

Start with the v1 recommended rules:

- `file-not-included` - error
- `no-config-function-in-source` - error
- `no-invalid-token-paths` - error
- `no-invalid-nesting` - error
- `no-debug` - warn
- `no-dynamic-styling` - warn
- `no-hardcoded-color` - warn
- `no-property-renaming` - warn
- `no-unsafe-token-fn-usage` - warn
- `no-deprecated-tokens` - warn

Opt-in style rules:

- `no-important`
- `no-margin-properties`
- `no-physical-properties`
- `prefer-longhand-properties`
- `prefer-shorthand-properties`
- `prefer-atomic-properties`
- `prefer-composite-properties`
- `prefer-unified-property-style`

Future Chakra-inspired rules:

- `props-order`
- `prefer-pattern-component`

## Implementation Guidance

- Add the richer `FileInspectionResult` in phases. Start with data the compiler already has, then add span-aware
  `styleEntries` only where rules need autofixes.
- Keep `compiler.spec()` as the project-wide metadata API. Do not add a lint-only mode; add typed recipe/pattern
  projections to the default spec shape instead.
- Keep every returned inspection item byte-addressable. ESLint nodes use byte ranges.
- Keep `inspectFileSource` stateless. It should not mutate project CSS state.
- Use `compiler.spec()` for project-wide lookups. Use `inspectFileSource()` for per-file inspection.
- Use AST visitors for rules with autofix. Use Panda inspection data to decide whether the node is in Panda code.
- Use `compiler.isSourceFile(filename)` for `file-not-included`.
- Use `compiler.resolveUtilityValue()` only for exact value classification and cache by `(prop, value)`.
- Treat parse diagnostics from `inspectFileSource()` as warnings in lint by default unless the user opts into strict
  extraction diagnostics.

## Testing

Test three layers:

1. Internal core modules: metadata loading, import matching, range indexes, target detection.
2. ESLint: `RuleTester` plus flat-config integration tests.
3. Oxlint: `jsPlugins` integration tests.

Fixtures should cover import aliases, local styled factories, generated JSX imports, nested selectors, invalid token
refs, files outside `include`, design-system build info, and parse diagnostics.

## Rollout

1. Extend `inspectFileSource()` with low-cost existing data: imports, matched imports, calls, JSX, token refs,
   diagnostics, component entries, and recipe/pattern ownership.
2. Add coarse `styleEntries` derived from folded literals. Use enclosing call/JSX spans when exact key/value spans are
   not available, and mark those entries `fixable: "report-only"`.
3. Port `@pandacss/eslint-plugin` to v2 APIs with internal `src/core/*` modules.
4. Add the Oxlint plugin adapter.
5. Add span-aware `styleEntries`, `sourceValue`, and provenance only for rules that need safe autofixes.
6. Compare behavior against `@azu/eslint-plugin-panda-oxc` on representative fixtures.

## Unresolved Questions

- Should ESLint expose optional `panda/*` aliases, or should the short namespace be Oxlint-only?
- Should Oxlint expose `@pandacss/*` aliases for migration from `@azu/eslint-plugin-panda-oxc`?
- Should `extraction-diagnostics` live in recommended or stay opt-in?

## Related

- [Build info](./build-info.md)
- [Virtual styled-system](./virtual-styled-system.md)
- [JSX tag matching](./jsx-tag-matching.md)
- [Extraction pipeline](./extraction-pipeline.md)
