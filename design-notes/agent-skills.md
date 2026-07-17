---
title: Official Panda Agent Skills
status: draft
scope:
  - skills/ (proposed publish path)
  - website/ (cross-links)
  - packages/mcp
  - packages/cli
related:
  - cli-design-md.md
  - design-system-manifest.md
  - virtual-styled-system.md
  - hooks.md
  - jsx-tag-matching.md
---

# Official Panda agent skills

Portable Agent Skills that teach LLMs and IDE assistants how to **use** Panda correctly — API choice, tokens, recipes,
extraction constraints, setup, design systems, and v2 migration. Installable via the open skills ecosystem
([skills.sh](https://skills.sh/), `npx skills add …`).

This note is the implementation brief. When you add or change a skill, update this doc in the same PR.

## What this note owns

- Skill inventory (names, triggers, content outlines)
- Layering vs `DESIGN.md`, `@pandacss/mcp`, and repo `AGENTS.md` / Cursor rules
- File layout, publish path, and Agent Skills format contract
- Ship phases and acceptance checks
- Canonical dos/don'ts and LLM anti-patterns to encode

Not in scope here:

- [CLI DESIGN.md export](./cli-design-md.md) — project-specific token brief (`panda design-md`)
- [Design-system manifest](./design-system-manifest.md) — `panda.lib.json` / `designSystem` compiler contract
- `@pandacss/mcp` tool schemas — live lookup API
- Contributor / Rust-engine skills (`rust-engineer`, etc.) — those live under `.claude/agents/` for **this** repo

## Why we need this

AI-assisted coding is the default workflow for many Panda users. Without grounded skills, agents:

- Emit Tailwind class strings or Emotion/styled-components patterns in Panda projects
- Invent raw hex / spacing instead of tokens
- Put one-off layout in recipes (or the reverse)
- Write non-extractable dynamic style objects
- Wire design systems via `include: ['…/panda.buildinfo.json']` instead of `designSystem`
- Confuse v1 hooks / packages with v2

Community coverage today is thin (e.g. unofficial `hashintel/hash@panda-css` ~60 installs on skills.sh). Chakra already
ships official skills (`chakra-ui-builder`, `chakra-ui-refactor`, `chakra-ui-migrate`). Panda should do the same for
**usage**, not for contributing to the compiler.

Discussion signal: [Panda v2 feedback #3599](https://github.com/chakra-ui/panda/discussions/3599) — request for official
AI skills / guidelines.

## What we're building

Six job-shaped skills (not one encyclopedia):

| Skill                 | Agent job                                     |
| --------------------- | --------------------------------------------- |
| `panda-styling`       | Write / edit styles in app or component code  |
| `panda-recipes`       | Build or change recipes / slot recipes / CVA  |
| `panda-tokens`        | Author or extend theme tokens & conditions    |
| `panda-setup`         | Install, init, wire Vite/PostCSS, first build |
| `panda-design-system` | Publish / consume libraries (`panda lib`)     |
| `panda-migrate-v2`    | Upgrade from v1 or navigate v2 beta diffs     |

Plus:

1. Publish from the Panda repo (or a dedicated `pandacss/skills` / `chakra-ui/panda` skills root) so
   `npx skills add <owner/repo>@panda-styling` works.
2. List skills on skills.sh with clear descriptions (trigger text matters for discovery).
3. Stub lines in `panda init` / docs / `AGENTS.md` examples pointing agents at skills + `DESIGN.md` + MCP.
4. Keep each skill short (~200–300 lines of body). Link docs for depth; skills are decision engines.

## What we're not building

- Not a dump of the whole website into one `SKILL.md`
- Not a replacement for `@pandacss/mcp` (live token/recipe lookup)
- Not a replacement for `DESIGN.md` (this product's brand/token brief)
- Not contributor skills for hacking `crates/*` (separate from end-user skills)
- Not auto-generated skills from config (skills are procedural; `DESIGN.md` is project data)
- Not framework-specific mega-skills in v1 (`panda-jsx-react` can wait for phase 2)

## How this fits other agent layers

| Layer                | Where it lives                    | Who reads it | How it updates           |
| -------------------- | --------------------------------- | ------------ | ------------------------ |
| Procedural usage     | Official Agent Skills (this note) | Any agent    | Release with docs/skills |
| Project design brief | `DESIGN.md`                       | Agents       | `panda design-md`        |
| Code conventions     | `AGENTS.md`, `.cursor/rules`      | Agents       | Humans edit              |
| Compiler contract    | `panda.lib.json`, build info      | Panda        | `panda lib`              |
| Live lookup          | `@pandacss/mcp`                   | MCP agents   | Runtime                  |

Stub for consumer `AGENTS.md` (also useful in `panda init` help):

```md
For UI work: use official Panda skills (`panda-styling`, `panda-recipes`, …). Follow DESIGN.md when present. Use
@pandacss/mcp for token/recipe/pattern lookups. Prefer css(), patterns, and recipes — don't invent raw values or
Tailwind classes.
```

Skills answer **how**. DESIGN.md answers **what this brand allows**. MCP answers **what exists right now**.

## Lessons from Tailwind / Chakra skills (skills.sh)

Useful patterns to copy:

1. **When to Use** at the top — agents decide load vs skip from the description + this section.
2. **Read project context first** — `package.json` Panda version, `panda.config.ts`, `jsxFramework`, `outdir`, lockfile.
   Chakra's `chakra-ui-builder` does this well.
3. **Decision tables** — “need X → use Y”, not essays.
4. **✅ / ❌ examples** — short, copyable, extractable.
5. **Split by job** — Chakra: builder / refactor / migrate. Tailwind packs that mix “design system + components +
   migration” into one skill get long; we split.
6. **Migration as its own skill** — v3→v4 Tailwind checklists work because they aren't mixed into daily styling.

Avoid:

- Giant “patterns gallery” of cards/nav/modals that ignore the user's tokens (that's DESIGN.md + recipes).
- Teaching Tailwind utility strings as the mental model for Panda.

Reference installs (order-of-magnitude, skills.sh): `tailwind-design-system` (~55k), `tailwind-css-patterns` (~14k),
Chakra official builder/refactor/migrate (~1–2k each). Panda should aim for the Chakra shape (official, job-split) with
Tailwind-quality decision density.

## Format contract (Agent Skills)

Each skill is a directory with a required `SKILL.md`:

```txt
panda-styling/
  SKILL.md          # required
  reference.md      # optional — longer tables, link targets
  examples.md       # optional — extra fixtures if SKILL.md would bloat
```

### Frontmatter (required)

```yaml
---
name: panda-styling
description: >-
  Use when writing or editing Panda CSS styles in application or component code. Covers css(), patterns, conditions,
  tokens vs raw values, and static extraction rules. Do not use for recipe authoring (panda-recipes), theme tokens
  (panda-tokens), or v1→v2 migration (panda-migrate-v2).
---
```

Rules:

- `name`: lowercase, hyphens, ≤64 chars, stable forever.
- `description`: ≤1024 chars. **Must include trigger phrases and negative triggers** (“do not use for…”) so routers pick
  the right skill.
- Body: lead with the point. Match [`TONE_OF_VOICE.md`](../TONE_OF_VOICE.md).
- Prefer one idea per bullet. Show code. No hype words.

### Shared opening section (every skill)

```md
## Before you start

1. Read `package.json` for `@pandacss/*` version (`latest` = v1, `@beta` / `2.x` = v2).
2. Read `panda.config.ts` (presets, `jsxFramework`, `outdir`, `strictTokens`, `designSystem`).
3. If `DESIGN.md` exists, treat it as brand authority for token choice.
4. Prefer `@pandacss/mcp` for live token/recipe/pattern names over inventing paths.
```

### Size budget

| Part            | Target                          |
| --------------- | ------------------------------- |
| `SKILL.md` body | ≤300 lines; prefer ≤200         |
| Extra files     | Only when tables would dominate |
| External links  | Docs URLs + `V2_MIGRATION.md`   |

If a section grows past ~40 lines, split to `reference.md` and keep a 5-line summary + link in `SKILL.md`.

## Repository layout (proposed)

Prefer shipping from the Panda monorepo so skills stay in lockstep with APIs:

```txt
skills/
  panda-styling/SKILL.md
  panda-recipes/SKILL.md
  panda-tokens/SKILL.md
  panda-setup/SKILL.md
  panda-design-system/SKILL.md
  panda-migrate-v2/SKILL.md
  README.md                 # install commands, which skill when
```

Alternatives (decide before first publish):

| Option                         | Pros                            | Cons                         |
| ------------------------------ | ------------------------------- | ---------------------------- |
| `skills/` in `chakra-ui/panda` | One repo, version with releases | Skills noise in product repo |
| `chakra-ui/panda-skills`       | Clean publish surface           | Extra repo to sync           |

Install UX (skills CLI):

```sh
npx skills add chakra-ui/panda@panda-styling
npx skills add chakra-ui/panda@panda-recipes
# or add the whole pack if the CLI supports directory packs
```

Align naming with Chakra's `@skill` entries for familiarity.

## Core skill specs

Implementation checklist for each skill: frontmatter description, Before you start, decision table, dos/don'ts,
anti-patterns, 2–4 minimal code samples, “see also” links to sibling skills + docs.

### 1. `panda-styling`

**Trigger:** Writing or editing styles in app/component code (not defining recipes or theme).

**Must teach:**

| Need                       | Use                                                |
| -------------------------- | -------------------------------------------------- |
| One-off / local styles     | `css({ … })` from `outdir` / import map            |
| Reusable layout primitives | Patterns (`stack`, `hstack`, `grid`, `cq`, …)      |
| Variant API on a component | → hand off to `panda-recipes`                      |
| JSX style props            | Only when `jsxFramework` is set; respect jsx match |

**Content outline:**

1. Import from configured `outdir` / import map (never invent `@pandacss/dev/css` runtime paths that aren't generated).
2. Token values vs raw CSS; escape hatch `[value]` under strict mode.
3. Conditions: `_hover`, `_dark`, responsive objects `{ base, md }`, nest selectors (`& .child`, `&.is-open`).
4. Composition: `css(a, b)`, `.raw()`, cross-file static imports (what folds / what doesn't).
5. Static extraction rules — literals and resolvable locals only; no runtime-computed property maps.
6. Do not: Tailwind class strings, Emotion `css` template props, spreading non-literal objects, `className` as a fake
   style prop on patterns.

**Anti-patterns to list explicitly:**

```ts
// ❌ Tailwind in a Panda project
<div className="flex items-center gap-2" />

// ❌ Non-extractable
css({ color: someRuntimeFlag ? 'red' : 'blue' }) // ok if both branches literal — flag dynamic keys/objects

// ❌ Invented tokens
css({ color: 'brandPrimary' }) // use real paths from theme / MCP / DESIGN.md

// ✅
css({ color: 'fg.muted', px: '4', _hover: { color: 'fg' } })
```

**See also:** `panda-recipes`, `panda-tokens`.

### 2. `panda-recipes`

**Trigger:** Adding or changing `cva` / `sva` / `defineRecipe` / `defineSlotRecipe` / slot context helpers.

**Must teach:**

- When recipe vs `css()` vs pattern (decision table).
- Config recipes (`defineRecipe` in config) vs runtime `cva` in source.
- Slot recipes: slots, `compoundVariants`, anatomy.
- JSX / context: `createRecipeContext` vs `createSlotRecipeContext` (v2); no `createStyleContext`.
- Compound variants: eager emit + `optimize.smartCompoundVariants` (one short note; link migration guide).
- Don't park page-level layout in a recipe; don't duplicate token scales inside recipe `base`.

**Content outline:**

1. Decision: variants needed by consumers? → recipe. Pure layout? → pattern/`css`.
2. Minimal `cva` / `defineRecipe` examples with typed export (`RecipeRuntimeFn`) if `isolatedDeclarations`.
3. Slot recipe + `withProvider` / `withContext` / `withRootProvider`.
4. `defaultVariants`, compound variants, responsive variant values.
5. Dynamic variant props → JIT / diagnostics (`recipe_variant_dynamic`) — warn agents not to rely on runtime-only
   variants without defaults.

**See also:** `panda-styling`, `panda-migrate-v2` (context helpers rename).

### 3. `panda-tokens`

**Trigger:** Editing `theme.tokens`, semantic tokens, text styles, layer styles, breakpoints, conditions.

**Must teach:**

- Hierarchy: core tokens → semantic tokens → text/layer styles → component recipes.
- Categories and path syntax (`colors.red.500`, `fg.muted`).
- Conditions & breakpoints; container query theme keys (link note, don't duplicate).
- `strictTokens` / `strictPropertyValues` behavior, including empty categories still accepting native keywords (v2).
- Keyword vs token name collisions (e.g. `lineHeights.normal` vs CSS `normal`) — token wins; use escape hatch or rename.
- Don't: redefine spacing/color scales ad hoc in every recipe; don't put component-specific one-offs in global tokens
  without a semantic name.

**Content outline:**

1. Where tokens live in config + presets (`@pandacss/preset-base`, `@pandacss/preset-panda`).
2. Semantic tokens with `_light` / `_dark` (or project condition names from config).
3. Text styles / layer styles — when to use vs recipes.
4. Referencing tokens in styles (`color: 'fg.muted'`) and in other tokens (`{colors.red.500}`).
5. Token reference syntax option (`tokenSyntax: '$'`) — one pointer to
   [token-reference-syntax.md](./token-reference-syntax.md).

**See also:** `panda-styling`, `cli-design-md.md` / DESIGN.md for brand prose.

### 4. `panda-setup`

**Trigger:** Greenfield install, “add Panda to this app”, or broken init (missing layers / presets).

**Must teach:**

- v1 (`latest`) vs v2 (`@beta` / `2.x`) channel — don't mix packages.
- Requirements: ESM, Node ≥22 for v2.
- Install `@pandacss/dev`, optional `@pandacss/vite` / `@pandacss/postcss`.
- `panda init` flags; cascade layers in CSS; presets are required in v2 (no auto-inject).
- `include` / `exclude` / `outdir`; codegen + `panda build` / `panda dev` loop.
- PostCSS vs Vite plugin (PostCSS experimental on v2 — say so honestly).

**Content outline:**

1. Detect existing setup before scaffolding.
2. Minimal `panda.config.ts` with both presets.
3. Root CSS `@layer` line.
4. First `css()` usage + import path.
5. Common failures: CJS require, missing presets, wrong Node, forgetting codegen.

**See also:** `panda-migrate-v2` if upgrading; `panda-design-system` for libraries.

### 5. `panda-design-system`

**Trigger:** Publishing a component library or consuming one with `designSystem`.

**Must teach (align with `V2_MIGRATION.md` Design systems):**

```sh
# publish source / monorepo
panda lib

# built-only package ("files": ["dist"])
panda lib --files './**/*.{js,mjs}'
```

- Artifacts: `panda.lib.json`, `panda.buildinfo.json`, `panda.preset.mjs`.
- Consume with `designSystem: '@acme/ds'` — **never** put buildinfo in `include`.
- Import styles from **local** `outdir` after `panda build` / `codegen` (merged types); package-root `/css` typing may
  fail.
- Chains: each package ships its own atoms; parents compose via `designSystem`.
- Peer range: `workspace:` / `catalog:` / `npm:` → portable; `--panda <range>`.
- Monorepo CSS: `panda cssgen --minimal` for package usage sheets (link migration monorepo section).

**See also:** [design-system-manifest.md](./design-system-manifest.md), [build-info.md](./build-info.md),
[virtual-styled-system.md](./virtual-styled-system.md).

### 6. `panda-migrate-v2`

**Trigger:** Upgrading from Panda v1, or debugging “works in 1.x / breaks on beta”.

**Must teach:**

- Channels and install (`@beta`), ESM-only, Node 22.
- Packages folded into `@pandacss/compiler` — stop importing `@pandacss/core`, etc.
- Hooks → `plugins[{ name, hooks }]`; supported vs removed hooks; `cssgen:done` observe-only; `optimize.*` for cleanup.
- `createStyleContext` → `createRecipeContext` / `createSlotRecipeContext`.
- `--cpu-prof` → `--profile`; MCP via `@pandacss/mcp` not `panda mcp`.
- Intentional CSS/class diffs worth knowing (e.g. typography shorthand class names like `td_none`); point to “What
  changed” in `V2_MIGRATION.md` rather than duplicating the full guide.
- Extraction / JSX: `jsxFramework` required for style-prop extraction; Astro/Svelte/Vue notes at a high level.
- Design-system path: `panda ship` → `panda lib` + `designSystem`.

**Content outline:**

1. Upgrade checklist (ordered).
2. Break table: old → new (hooks, context helpers, flags, packages).
3. “If CSS looks wrong” — nested selectors, compositions, shorthands — link discussion fixes / changelog themes, don't
   paste every bug.
4. Point to full [`V2_MIGRATION.md`](../V2_MIGRATION.md).

**See also:** all other skills for post-upgrade usage.

## Shared dos / don'ts (encode in skills, keep consistent)

Central list so skills don't contradict each other. Copy subsets into the relevant skill; don't fork wording.

### Do

- Use tokens and semantic tokens from the resolved theme / DESIGN.md / MCP.
- Prefer patterns for layout; recipes for variants; `css()` for local composition.
- Keep style objects statically extractable.
- Run `panda codegen` / `panda build` after config or designSystem changes.
- Import from the app `outdir` when consuming a design system (beta typing convention).

### Don't

- Mix v1 and v2 `@pandacss/*` versions.
- Put `panda.buildinfo.json` in `include`.
- Pass `className` to patterns as if it were a style utility (types shouldn't advertise this; runtime class soup).
- Rely on `parser:before.configure` / removed v1 hooks.
- Generate Tailwind utility strings “to be fixed later”.
- Assume JSX style props extract without `jsxFramework`.

## Phase plan

### Phase 0 — Scaffold (1 PR)

- Add `skills/` (or chosen repo layout) with README + empty skill dirs.
- Land this design note + README index link.
- Agree publish owner/repo string for `npx skills add`.

### Phase 1 — Core usage (highest leverage)

Ship **`panda-styling`** and **`panda-recipes`** with full bodies + examples.

Acceptance:

- Agent given a Button task uses recipe/`cva`, not only `css()` or Tailwind.
- Agent uses token paths present in a sample config, not invented hex.
- Negative description prevents loading recipes skill for pure layout.

### Phase 2 — Config & setup

Ship **`panda-tokens`** and **`panda-setup`**.

Acceptance:

- Greenfield Vite+React instructions produce working layers + presets + one `css()` usage.
- Token skill refuses to put one-off component colors into global scales without semantic naming guidance.

### Phase 3 — Systems & migration

Ship **`panda-design-system`** and **`panda-migrate-v2`**.

Acceptance:

- Agent never suggests `include: ['…buildinfo.json']`.
- Upgrade checklist mentions hooks→plugins and context helper rename.
- Cross-link `V2_MIGRATION.md` Design systems section (keep one source of truth for long prose).

### Phase 4 — Distribution & product hooks

- Publish to skills.sh; verify install commands.
- Docs page: “AI / Agent skills” with the table above.
- Optional: `panda init` prints stub `AGENTS.md` lines (coordinate with [cli-design-md.md](./cli-design-md.md)).
- Optional: MCP server README points at skills for procedural guidance.

### Phase 5 — Later skills (only if needed)

| Skill            | Why wait                                     |
| ---------------- | -------------------------------------------- |
| `panda-review`   | PR checklist; needs stable core first        |
| `panda-jsx`      | Framework forks; styling skill covers 80%    |
| `panda-perf`     | `--profile`, atomic bloat; niche             |
| `panda-patterns` | Extract from styling if that skill grows fat |

## Maintenance

- **API churn:** update skills in the same release PR as user-facing API changes (hooks, designSystem, recipe helpers).
- **Don't duplicate** long migration prose — link `V2_MIGRATION.md`.
- **Version note inside skills:** “Examples target Panda v2 (`2.x` / `@beta`). For v1, note differences or link.”
- **Quarterly pass:** run 5 fixed eval prompts (button recipe, token usage, lib consume, v1 upgrade, nested selector)
  against an agent with skills installed; fix drifts.
- **Tone:** [`TONE_OF_VOICE.md`](../TONE_OF_VOICE.md).

## Implementation checklist (per skill PR)

- [ ] `SKILL.md` frontmatter `name` + trigger-rich `description`
- [ ] Shared “Before you start” block
- [ ] Decision table + ✅/❌ samples
- [ ] Sibling skill links + docs links
- [ ] No contradiction with `V2_MIGRATION.md` / this note's shared dos/don'ts
- [ ] `skills/README.md` updated
- [ ] Manual agent smoke test (one prompt in PR description)
- [ ] This design note updated if inventory or triggers change

## Unresolved questions

- Publish from `chakra-ui/panda` `skills/` vs dedicated `panda-skills` repo?
- Single pack install (`npx skills add chakra-ui/panda`) vs per-skill only — what does the skills CLI support cleanly?
- Should `panda-migrate-v2` track beta.N footnotes or stay evergreen + link changelog?
- Do we vendor a tiny eval suite in-repo (`skills/evals/*.md` prompts) or keep it manual?
- Relationship to Cursor rules: generate `.cursor/rules/panda.mdc` from the same source, or skills-only for v1?

## Related

- [CLI DESIGN.md export](./cli-design-md.md)
- [Design-system manifest](./design-system-manifest.md)
- [Virtual styled-system](./virtual-styled-system.md)
- [Hooks](./hooks.md)
- [JSX tag matching](./jsx-tag-matching.md)
- [`V2_MIGRATION.md`](../V2_MIGRATION.md)
- [`TONE_OF_VOICE.md`](../TONE_OF_VOICE.md)
- [skills.sh](https://skills.sh/) — Agent Skills directory
- [Chakra UI skills](https://skills.sh/chakra-ui/chakra-ui/chakra-ui-builder) — builder / refactor / migrate precedent
