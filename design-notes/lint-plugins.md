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
  kind: 'jsx-component' | 'jsx-recipe' | 'jsx-slot-recipe' | 'jsx-pattern'
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
type StyleEntrySyntax = 'css-call' | 'jsx-prop' | 'jsx-style-prop' | 'recipe-call' | 'pattern-call' | 'template-style'
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

Some of this is mostly plumbing from existing extractor output: calls, JSX, diagnostics, and internal `token_refs`
already exist. Exact style entry ranges need source provenance because the folded `Literal::Object` intentionally stores
normalized values, not written key/value spans. Use `extract_verbose()` for inspection-only source refs while keeping the
lean extractor result unchanged for builds.

Do not put the richer inspection model on the production build path. `parseFileSource()` and the lean extractor should
stay optimized for compilation. `inspectFileSource()` is the on-demand tooling boundary, so it can serialize more data
and do extra classification as long as lint adapters call it once per file and cache the result across rules.

The first implementation should derive as much as possible from the current extraction result. It can expose calls, JSX,
token refs, diagnostics, component entries, recipe ownership, and style-entry classification without a second parse.
`extract_verbose()` should collect local source refs during the same traversal, then `inspectFileSource()` can mark direct
local keys as `fixable: "safe"` and keep generated or framework-template entries as `fixable: "report-only"`.

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
    { name: 'Action', kind: 'jsx-recipe', syntax: 'jsx-component', recipe: 'button' },
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
      kind: 'jsx-slot-recipe',
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

JSX is framework-agnostic. Source refs for JSX expressions also apply to masked Astro, Svelte, and Vue script
expressions because adapter masks preserve original byte offsets. Framework template attributes use the template-style
extractor and should stay report-only until that extractor emits its own key/value refs. Treat `css` and props ending in
`Css` as nested style objects:

```tsx
<Box inputCss={{ color: 'red.500' }} />
```

```ts
{
  styleEntries: [
    { name: 'color', syntax: 'jsx-style-prop', path: ['inputCss', 'color'], fixable: 'safe' },
  ],
}
```

## Parser Interaction

The linter parser remains the source of truth for reports and fixes. Panda is the source of truth for Panda semantics.

Per file:

```ts
async function getPandaLintContext(context: RuleContext): Promise<PandaLintContext> {
  const source = context.sourceCode.getText()
  const { project, result: inspection } = await linter.inspect(context)
  const fileState = buildFileState(context.sourceCode.ast, project, inspection)
  return { inspection, fileState }
}
```

`Linter` composes `ProjectCache` and `Inspector`: `ProjectCache` owns async config loading and compiler creation;
`Inspector` owns per-compiler file inspection caching by `(filename, sourceCacheKey)`. Keep ESLint rule visitors
synchronous. Config/project loading must happen before rule visitors run, through a flat-config/plugin factory or another
preload step; visitors should only consume already-available inspection data.

The plugin entry should be an async factory, e.g. `createPandaPlugin({ cwd, configPath })`, that preloads one
`ProjectContext` and returns rule modules bound to that ready compiler. Rule factories can then call
`linter.inspectProject(project, path, source)` synchronously inside `Program()` without spawning async work per file.

The first shipped rules are `extraction-diagnostics`, `file-not-included`, `no-invalid-token-paths`,
`no-deprecated-tokens`, `no-debug`, and `prefer-token` (colors). See the [Rule Set](#rule-set) for the full catalog.

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

## Property Ordering

`props-order` should default to Panda's canonical property order. The source of truth is `compiler.spec().propertyOrder`,
which is produced by the stylesheet sorter from the resolved utility properties. This order is cascade-aware: broad
properties and shorthands sort before narrower longhands so generated CSS remains deterministic when style objects mix
overlapping properties.

The rule should use `introspect(spec).compareProps()` / `sortProps()` instead of shipping a separate order table.
Alternate order modes can be added later, but `panda` should remain the default:

```ts
type PropsOrderMode = 'panda' | 'alphabetical' | 'grouped'
```

Sorting must be conservative:

- Sort only local, contiguous style-entry groups with exact AST spans.
- Break groups around spreads, computed keys, unknown provenance, and unsafe comments.
- Respect blank-line groups when configured.
- Move full property text, including leading comments and trailing commas.
- Do not sort recipe/config wrapper objects; sort only the style objects inside them.

The same ordering applies to grouped styles such as recipe and slot-recipe style objects. For `cva()` and `sva()`, sort
inside `base`, variant option style objects, and `compoundVariants[].css`, but not structural keys such as `variants`,
`defaultVariants`, `slots`, or slot names.

Config recipes have the same style-ordering semantics, but config source linting is a separate implementation concern.
The first lint plugin pass should focus on source files handled by normal extraction. Config recipe sorting can be added
later through config-source inspection or narrowly-scoped ESLint AST detection for `defineConfig(...)`.

## Require Recipe Type Annotation

`require-recipe-type-annotation` reports an exported `const` initialized by an inline Panda recipe call that has no
explicit type annotation, and autofixes it by inserting a key-only annotation. The target is users on
`isolatedDeclarations` or anyone who wants small `.d.ts` files. See the
[isolated declarations guide](../website/content/docs/guides/isolated-declarations.mdx) for the user-facing patterns.

This is the rare rule that is worth shipping only because of its fix. TypeScript already flags the missing annotation
under `isolatedDeclarations`, but its quick-fix inlines the *resolved* type, which for an inline recipe includes the full
CSS — the exact bloat users are escaping. The lint engine already knows the variant keys and slots from extraction, so it
can insert the minimal annotation TypeScript can't produce.

Target detection:

- Report on `export const x = <call>` where the callee resolves through `inspection.imports` to `cva`, `sva`, or the JSX
  factory (`styled`), and the declarator has no type annotation.
- Skip non-exported consts. They don't reach declaration emit.
- Skip calls whose recipe argument is a reference to an already-typed recipe function (the recipe-fn `styled(tag, button)`
  overload already resolves to a named `__type`).

Building the annotation from inspection data:

- Read variant keys and option names from `inspection.styleEntries` with `kind: "recipe-variant"`; read slots from the
  `componentEntries`/owner for `sva`.
- `cva` → `RecipeRuntimeFn<{ key?: 'a' | 'b' }>` from `styled-system/types`.
- `sva` → `SlotRecipeRuntimeFn<'root' | 'icon', { key?: 'a' | 'b' }>` from `styled-system/types`.
- `styled(tag, {...})` → `StyledComponent<'tag', { key?: 'a' | 'b' }>` from the generated jsx entrypoint.
- A `{ true, false }` variant becomes `boolean` (mirror `StringToBoolean`), not `'true' | 'false'`.
- Add the type import via the fixer, resolved from the project outdir like other generated imports.

Fixability follows the `styleEntries` provenance model:

- `fixable: "safe"` only when every variant value folds to a static key set (`origin: "local"`). Then autofix.
- `origin: "computed" | "spread"` or conditional variant values → report-only. The key union isn't exact, so suggest
  moving the recipe into config instead of inserting a wrong annotation.

Drift is out of scope for the first version. The rule adds a missing annotation; it does not reconcile an existing
annotation that has gone stale. Generating a named props type per inline recipe (so the fix can reference a stable name
instead of an inlined union) is a follow-up that removes the drift risk entirely; see
[generated types](./generated-types-design.md).

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

Status legend:

- ✅ shipped
- 🟢 buildable now — the inspection/spec data already exists
- 🟡 needs a new spec projection (surface data the config already carries)
- 🔴 needs config + compiler support
- **(D)** default-on in `recommended` · **(O)** opt-in

The recommended set should stay small and high-signal. Restriction and deprecation are consolidated into single
configurable rules instead of many narrow ones; the narrow variants (margin/physical/longhand presets) ship as
documented presets, not separate rule modules.

### Correctness / silent-failure

These catch mistakes that today emit no error and no CSS — the strongest argument for a Panda-specific plugin, since
they rely on the resolved compiler model rather than string matching.

- `extraction-diagnostics` ✅ (D) — surface parse/extraction diagnostics for the file.
- `file-not-included` ✅ (D) — file uses Panda but is outside the config `include` globs (`compiler.isSourceFile`).
- `no-invalid-token-paths` ✅ (D) — unresolved token reference (`tokenRefs[].resolved === false`).
- `no-debug` ✅ (D) — the `debug` style entry left in source.
- `no-unknown-condition` 🟢 (D) — condition-shaped key (`_*`, `*:`, `&`) not in `spec.conditions.keys` (typo'd `_hver`).
- `no-unknown-recipe-variant` 🟡 (D) — variant key/value not declared on the recipe; needs a variant projection in
  `spec.recipes`.
- `no-invalid-utility-value` 🟡 (O) — value a utility can't resolve; needs a clean `null`-vs-arbitrary signal from
  `resolveUtilityValue`.
- `no-unknown-property` 🔴 (O) — typo'd style key; needs a CSS-property dictionary to avoid flagging valid arbitrary CSS.
- `no-invalid-nesting` 🟢 (D, v1) — invalid nested selector.
- `no-dynamic-styling` 🟢 (D, v1) — values the compiler can't statically extract.
- `no-property-renaming` 🟢 (D, v1) · `no-unsafe-token-fn-usage` 🟢 (D, v1).

### Deprecation

Ship a single `no-deprecated` rule with a `{ kinds: [...] }` option rather than one rule per entity. One rule keeps the
surface small; the option lets teams scope it. The cost of consolidation is a single ESLint severity across kinds —
split per kind only if teams need different severities.

`no-deprecated` (D) is implemented as a single rule with a `{ kinds }` option, covering:

- tokens ✅ — detected via `usages` (kind `token`), so it catches `token(...)` calls, bare category values
  (`color: 'old'`), values in conditions and responsive arrays, and `/opacity` modifiers (path normalized).
- utilities / properties ✅ — `spec.utilities.deprecated`, matched against utility `styleEntries`.
- recipes ✅ — `spec.recipes`/`spec.slotRecipes` carry `deprecated`; flagged via recipe `usages` (calls) and
  `componentEntries.recipe` (JSX).
- patterns ✅ — `spec.patterns` carry `deprecated`; flagged via pattern `usages` (calls) and
  `componentEntries.pattern` (JSX, resolved through `PatternRegistry::resolve_name`).
- recipe variants & values 🔴 — e.g. `variant="solid"` when `solid` is deprecated; needs per-variant deprecation in
  config + spec.

Author messages (`deprecated: 'use X instead'`) flow through to the lint message for tokens, recipes, and patterns
(utility config is boolean-only). **Conditions cannot be marked deprecated** — there is no config surface for it, so
it is out of scope.

Compiler deprecation surface (done): `Token` carries the message; `spec.tokens.deprecated` / `spec.utilities.deprecated`
are `name → (true | message)` maps; recipe/pattern type definitions expose `deprecated`; `spec.recipes`,
`spec.slotRecipes`, and `spec.patterns` are top-level (un-nested).

### Design-system enforcement (opt-in, configurable)

- `no-important` ✅ (O) — flag `!important` (trailing `!` or `!important`) in style values.
- `no-margin-properties` ✅ (O) — flag margin utilities (`margin`, `mt`, `mx`, logical `marginInline*`, …); nudge toward
  `gap`/layout patterns.
- `no-physical-properties` ✅ (O) — flag physical properties/values that have logical equivalents (`left` → `insetInlineStart`,
  `marginLeft` → `marginInlineStart`, `textAlign: 'left'` → `'start'`, …) via a curated physical→logical map.
- `prefer-text-style` ✅ (O) — flag a style object that sets ≥2 typography properties (fontSize/fontWeight/lineHeight/…)
  that should be a single `textStyle` token; grouped per object via `calls`/`jsx` data.
- `prefer-token` ✅ — raw value where a token category exists (colors, spacing, fontSizes, radii, …), backed by
  `resolveUtilityValue` (resolved `cssValue` isn't a `var(...)`). Options: `categories` (default all) and `allow`. The
  message names the token to use, via `compiler.suggestToken` — semantic tokens preferred over the primitives they
  reference, with value normalization (`#FFF`==`#ffffff`, `16px`==`1rem`). **In `recommended` it's scoped to
  `categories: ['colors']`** — this replaces the standalone `no-hardcoded-color` (folded; see migration in the README).
  The single configurable rule is the orthogonal API; v1's `no-hardcoded-color` name is dropped. Detection and per-leaf
  quick-fixes span every style-writing form: `css()`, style props, responsive arrays, per-prop conditions, and recipe
  styles in `cva()` / `sva()` / `styled('div', { ... })` (`base`, `variants.*`, `compoundVariants[].css`).
- `restrict-styles` 🟢 (O) — general configurable restriction: glob property pattern → `{ limit, reason }`, where `limit`
  bans the property (`null`) or whitelists allowed values. For custom team policies beyond the named rules above.
- `no-restricted-tokens` 🟢 (O) — deny specific tokens / palettes (legacy palette during a migration, internal-only
  tokens).
- `prefer-semantic-tokens` 🟡 (O) — primitive token (`red.500`) where a semantic token exists; needs a semantic-token
  projection.
- `no-arbitrary-values` 🟢 (O) — ban the `[...]` escape hatch (`resolveUtilityValue` source `Arbitrary`); v1 calls this
  `no-escape-hatch`.

### Source hygiene

- `no-config-function-in-source` 🟢 (D) — `defineConfig` / `defineRecipe` imported into app source.
- `no-conflicting-props` 🟢 (O) — `className` or `style={}` mixed with Panda style props / `css` on one element.
- `no-unused` 🟡 (O) — a defined recipe / style never referenced.

### Style / ergonomics (opt-in, fixable)

- `prefer-longhand-properties` 🟢 · `prefer-shorthand-properties` 🟢 · `prefer-atomic-properties` 🟢
  · `prefer-composite-properties` 🟢 · `prefer-unified-property-style` 🟢
- `props-order` 🟡 — canonical `spec.propertyOrder`; needs span-accurate `styleEntries` (see Property Ordering).
- `require-recipe-type-annotation` 🟡 — see its section; needs real `styleEntries` provenance.
- `prefer-pattern-component` 🟡 — nudge raw layout styles toward pattern components.

### v1 (`eslint-plugin-panda`) parity

Port status of the v1 rules (recommended ones default-on, the rest opt-in):

- Shipped ✅: `file-not-included`, `no-debug`, `no-deprecated-tokens` (→ `no-deprecated`), `no-hardcoded-color` (→ `prefer-token` colors preset),
  `no-invalid-token-paths`, `no-important`, `no-margin-properties`, `no-physical-properties`.
- High-value next (Tier 1, data exists): `no-unsafe-token-fn-usage` 🟢 (`tokenRefs[].needsCssVar`), `no-invalid-nesting`
  🟢, `no-dynamic-styling` 🟢 (compiler diagnostics), `no-property-renaming` 🟡, `no-config-function-in-source` 🟡
  (needs `imports` on the inspection result).
- Consolidated / renamed: `no-escape-hatch` → `no-arbitrary-values`; ad-hoc restrictions → `restrict-styles`.
- Stylistic (Tier 3, fixable): `prefer-longhand-properties`, `prefer-shorthand-properties`, `prefer-atomic-properties`,
  `prefer-composite-properties`, `prefer-unified-property-style`.
- v2-only additions: `extraction-diagnostics`, `prefer-text-style`.

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

1. Extend `inspectFileSource()` with low-cost existing data: calls, JSX, token refs, diagnostics, component entries, and
   recipe/pattern ownership.
2. Add `extract_verbose()` source refs for local object keys and JSX attributes so `styleEntries` can expose `keySpan`,
   `valueSpan`, and `fixable: "safe"` without changing the production extractor result.
3. Port `@pandacss/eslint-plugin` to v2 APIs with internal `src/core/*` modules.
4. Add the Oxlint plugin adapter.
5. Add recursive `sourceValue` and richer provenance only for rules that need it.
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
