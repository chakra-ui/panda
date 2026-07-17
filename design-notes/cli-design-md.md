---
title: CLI DESIGN.md Export
status: draft
scope:
  - packages/cli
  - packages/compiler
  - packages/compiler-shared
  - packages/mcp
related:
  - cli.md
  - cli-analyze.md
  - design-system-manifest.md
  - output-and-host-layer.md
  - agent-skills.md
---

# Export DESIGN.md from the CLI

`panda design-md` writes a [DESIGN.md](https://github.com/google-labs-code/design.md) file from your resolved Panda
config. Agents read it without MCP, without you re-pasting tokens every session.

You get deterministic YAML tokens and scaffolded prose. You still write brand voice and do's/don'ts yourself.

## What this note owns

Command shape, Panda → DESIGN.md mapping, prose scaffold patterns, drift/CI contracts, and hooks into `panda lib` /
agent context files.

Not in scope here:

- [Design-system manifest](./design-system-manifest.md) — `panda.lib.json`
- [CLI v2 direction](./cli.md) — shared flags, exit codes
- `@pandacss/mcp` tool surface

## Why we need this

Agents ship generic UI unless you give them persistent design context. Teams patch that with ad-hoc `AGENTS.md` rules,
Figma copy-paste, or `@pandacss/mcp` (which needs MCP wired up and running).

[DESIGN.md](https://github.com/google-labs-code/design.md) (Google Labs, Apache-2.0, alpha) is one file in the repo:

1. YAML front matter — token values
2. Markdown body — when and why to use them

Panda already resolves more than most hand-written DESIGN.md files: tokens, semantic tokens, text styles, recipes, slot
recipes, breakpoints, patterns, utilities, import map. The CLI can export the token layer accurately and scaffold the
prose you fill in.

## What we're building

1. `panda design-md` → writes `./DESIGN.md` from resolved config
2. Google DESIGN.md schema — output passes `@google/design.md lint`
3. Same config → same YAML every time
4. Prose sections get headers and `TODO` blocks; `--merge` keeps your edits
5. `--check` for CI when the file drifts from config
6. Optional `panda lib --design-md` so design-system packages ship it
7. `## Agent Instructions` for Panda conventions (`css()`, recipes, `importMap`)

## What we're not building

- Not a replacement for `@pandacss/mcp` — file on disk vs live lookup
- Not a replacement for `panda.lib.json` — compiler still uses JSON
- Not auto-generated brand voice — you write do's/don'ts
- Not import from Figma / Tailwind / DTCG — export only in v1
- Not our own parallel format — no `panda.design.md` schema
- Not ownership of Google's spec — track `version: alpha`; expect churn

## How this fits with MCP and panda lib

| Layer             | Where it lives               | Who reads it | How it updates    |
| ----------------- | ---------------------------- | ------------ | ----------------- |
| Code conventions  | `AGENTS.md`, `.cursor/rules` | Agents       | You edit          |
| Design brief      | `DESIGN.md`                  | Agents       | `panda design-md` |
| Compiler contract | `panda.lib.json`, build info | Panda        | `panda lib`       |
| Live lookup       | `@pandacss/mcp`              | MCP agents   | Runtime           |

Stub for `AGENTS.md` (also in CLI help and init):

```md
For UI work, follow DESIGN.md. Use @pandacss/mcp for token, recipe, and pattern lookups. Write styles with css(), cva(),
and configured recipes — don't invent raw CSS values.
```

## Running the command

```sh
panda design-md
```

```sh
panda design-md --out ./DESIGN.md
panda design-md --scaffold-only
panda design-md --check
panda design-md --merge
panda design-md --validate
panda design-md --json
```

| Flag                      | What it does                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `--out <path>`            | Write here (default `./DESIGN.md`)                                           |
| `--scaffold-only`         | YAML + section headers + TODOs; almost no auto prose                         |
| `--rich`                  | Full auto prose tier: characteristics, example prompts, iteration guide (P3) |
| `--check`                 | Exit 1 if output differs from `--out`                                        |
| `--merge`                 | Refresh YAML; keep your prose in known sections                              |
| `--validate`              | Run `npx -y @google/design.md lint` on the result                            |
| `--no-agent-section`      | Skip the Panda extension section                                             |
| `--name`, `--description` | Override front matter (default: package / config)                            |

Also: `--cwd`, `--config`, `--json`, `--format`, `--log-level`, `--max-warnings` from [CLI v2](./cli.md).

Does not run on every build. You run it explicitly, or opt in with `panda lib --design-md`.

### Why `design-md`

Kebab-case, matches the file name. Skip these:

| Name               | Why not                        |
| ------------------ | ------------------------------ |
| `design`           | Could mean Figma or CSS        |
| `export-design-md` | Other commands aren't prefixed |
| `agent-md`         | The format is DESIGN.md        |
| `handoff`          | Product word, not a CLI verb   |

## Where the export reads from

Same boundary as `panda info`, `panda analyze`, and MCP — after config load:

| Source                   | Export uses it for                                          |
| ------------------------ | ----------------------------------------------------------- |
| `driver.introspect.spec` | Tokens, recipes, patterns, conditions, utilities, keyframes |
| `driver.config.theme`    | Semantic tokens, text/layer/animation styles                |
| `driver.config`          | `importMap`, `jsxFactory`, `prefix`, conditions             |
| `package.json`           | Default `name`, `description`                               |
| Existing `DESIGN.md`     | User prose when `--merge`                                   |

Host layer only (`packages/cli` + a small pure module). No Rust work in v1 — `Spec` and theme JSON are enough.

## Mapping Panda to DESIGN.md

Google's YAML groups: `colors`, `typography`, `rounded`, `spacing`, `components`, plus `version`, `name`, `description`.

Prose: eight optional `##` sections in fixed order (Overview → … → Do's and Don'ts).

### Exporting tokens

| Panda                                 | DESIGN.md                    | Notes                                                           |
| ------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| `spec.tokens.values` (colors)         | `colors:`                    | Flatten paths; prefer semantic names when you have them         |
| `theme.semanticTokens.colors`         | `colors:` + `## Colors`      | Base value in YAML; conditions in prose                         |
| `theme.textStyles`                    | `typography:`                | `font`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing` |
| `spec.tokens.values` (radii)          | `rounded:`                   | `sm`, `md`, `lg`, `full`                                        |
| `spec.tokens.values` (spacing, sizes) | `spacing:`                   | Spacing scale first; mention sizes in Layout prose if needed    |
| `spec.recipes` base styles            | `components:`                | Lossy — see below                                               |
| `spec.conditions.breakpoints`         | `## Layout` prose            | No responsive tokens in the schema                              |
| `spec.patterns`                       | `## Components` or extension | No pattern YAML                                                 |
| `spec.utilities`                      | `## Agent Instructions`      | Shorthand conventions                                           |

Use `{path.to.token}` in `components:` for refs. Emit hex when sRGB-friendly; pass through `oklch()` / `var(--…)` when
that's what Panda resolved.

### Mapping recipes to components (lossy)

DESIGN.md allows flat keys with: `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`,
`width`. States are separate keys (`button-primary-hover`), not nested.

v1 rules:

1. One YAML entry per recipe — `defaultVariants`, or first variant value
2. State keys only when obvious (`hover` / `active` / `disabled` on a `variant` prop); else prose
3. Slot recipes — one entry per slot if style is uniform; else prose only
4. Compound variants — prose only

Don't try full recipe → component parity. Put variant matrices, slots, and compounds in `## Components` prose.

## Prose scaffold patterns

Google's spec defines eight body sections. The YAML is the easy part — agents still ship generic UI when the prose is
thin. These references and patterns are what the generator should imitate.

Read [PHILOSOPHY.md](https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md) first. It states the rule
plainly: prose is where the design lives; tokens support it. A specific reference ("1970s lecture handout") beats a
dozen adjectives ("modern, clean, premium"). Strong references carry don'ts for free; weak ones need long negative lists
that still fail.

### Reference corpus

Use these when writing generator templates and golden fixtures — not as content to paste into user projects.

**Tier 1 — spec-aligned (Google)**

| File                                                                                                              | Why read it                                                   |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [PHILOSOPHY.md](https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md)                            | Prose > tokens; specific reference; intentional don'ts        |
| [Heritage (README)](https://github.com/google-labs-code/design.md)                                                | Canonical color roles + poetic names ("Boston Clay")          |
| [atmospheric-glass](https://github.com/google-labs-code/design.md/blob/main/examples/atmospheric-glass/DESIGN.md) | Numbered elevation levels; `###` component subsections        |
| [totality-festival](https://github.com/google-labs-code/design.md/blob/main/examples/totality-festival/DESIGN.md) | Strong Overview mood; mandatory layout rules in prose         |
| [paws-and-paths](https://github.com/google-labs-code/design.md/blob/main/examples/paws-and-paths/DESIGN.md)       | Friendly default tone; semantic nicknames; spacing philosophy |

**Tier 2 — best prose (editorial; not Google's 8-section order)**

[WebDesignHot/design-md](https://github.com/WebDesignHot/design-md) ships ~285 brand-inspired files. Install with
`npx @webdesignhot/design-md add stripe`. Steal writing patterns, not the 14-section layout.

| File                                                                                       | Lines | Steal for                                                                        |
| ------------------------------------------------------------------------------------------ | ----- | -------------------------------------------------------------------------------- |
| [stripe.md](https://github.com/WebDesignHot/design-md/blob/main/design-md/stripe.md)       | ~750  | Key characteristics bullets; color roles with hex; don'ts tied to exact mistakes |
| [linear.md](https://github.com/WebDesignHot/design-md/blob/main/design-md/linear.md)       | ~995  | Do/Don't subheadings; §15 Agent Prompt Guide with copy-paste component prompts   |
| [vercel.md](https://github.com/WebDesignHot/design-md/blob/main/design-md/vercel.md)       | ~950  | Canvas discipline; "entry ticket" language; lineage vs other brands              |
| [anthropic.md](https://github.com/WebDesignHot/design-md/blob/main/design-md/anthropic.md) | large | Atmospheric vocabulary; restraint as brand signal                                |

Also: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) — smaller curated set (Apple,
Cursor, Figma, …).

**Tier 3 — field notes**

- [30 days with DESIGN.md](https://medium.com/design-bootcamp/i-used-design-md-for-30-days-with-claude-code-heres-what-actually-changed-9bf9d659ace8)
  — Do's and Don'ts matter more than YAML
- [Spec Do's example](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md) — short, rule-shaped
  guardrails

### Patterns per section

Generator templates should follow these moves inside Google's canonical section order.

**Overview / Brand & Style**

- One specific world reference, not adjective soup
- Audience in one line
- `**Key Characteristics:**` bullet list (5–10 concrete traits) — see Stripe Overview
- Optional: how this differs from default agent UI (Stripe vs Vercel comparison style is a template, not output)

**Colors**

- Per swatch: name + hex + role + never-use-for
- Pattern: `**Tertiary (#B8422E):** Boston Clay — sole driver for interaction`
- Group by role inside `## Colors`: Primary / Accent / Surface / Semantic / Shadow (WebDesignHot style, still one
  `## Colors` section)

**Typography**

- Font pairing rationale
- Weight rules per role (`headlines 510, never 700`)
- OpenType flags when relevant (`ss01`, `tnum`)
- Reading measure cap when `textStyles` or layout tokens imply one

**Layout**

- Name the grid model (fixed, fluid, broadsheet-narrow)
- Base unit + rhythm from `spacing` tokens
- Breakpoints from `spec.conditions.breakpoints` as prose — schema has no responsive YAML

**Elevation & Depth**

- Named levels with exact technique (glass `blur(20px)`, tonal steps `#08090a → #0f1011`)
- State what you don't use (drop shadows vs tonal layers) — atmospheric-glass, Linear

**Shapes**

- One-sentence philosophy + per-component radius rules from `rounded:` and recipes
- Forbid mixing geometry when radii scale is narrow (pill vs sharp)

**Components**

- `###` per atom (Buttons, Cards, Inputs) — Google examples
- Map to Panda recipe names: `` `button` recipe — variant `solid` for primary CTA ``
- Variant matrices, slots, compounds in prose when YAML can't express them

**Do's and Don'ts**

- Split `### Do` and `### Don't` — Linear, Stripe §14
- Tie each don't to a common agent mistake (`Don't use brand indigo as CTA fill`)
- Target 8–15 sharp rules, not 40 vague ones — PHILOSOPHY.md

**Agent Instructions (Panda extension)**

Steal Linear §15 structure:

1. Quick token / recipe cheat sheet
2. Three to six example prompts (hero, card, CTA) using resolved recipe names and token paths
3. Short iteration guide ("if the CTA is brand-colored, invert it")

Example prompt shape (generator fills placeholders):

```md
Create a hero on `{canvas}` with `{headingTextStyle}` headline, body at `{bodyTextStyle}`, reading width capped at
`{maxWidth}`. Primary CTA: `{recipe}` with variant `{variant}`. Import from `{importMap}/recipes`.
```

### Scaffold tiers

| Mode              | Body target                                                                         | Reference tier                    |
| ----------------- | ----------------------------------------------------------------------------------- | --------------------------------- |
| `--scaffold-only` | Section headers + `<!-- TODO: … -->` per section                                    | Google spec + PHILOSOPHY          |
| Default           | Auto prose from config: token role bullets, recipe index, breakpoints, starter do's | paws-and-paths, atmospheric-glass |
| `--rich` (P3)     | Key characteristics, component prompt examples, iteration guide                     | linear.md §14–15, stripe.md §14   |

Default output should land around 150–300 lines plus TODOs. Don't emit 700+ line files — that's editorial brand
research, not a project export.

`--merge`: replace TODO blocks only in sections the user hasn't edited (non-empty, non-TODO content).

### What not to copy into user output

| Source                         | Why skip                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| WebDesignHot 14-section layout | Out of Google section order; patterns only                        |
| Brand vs brand comparisons     | Stripe vs Linear — inspiration for templates, not user files      |
| Reconstructed brand tokens     | WebDesignHot is editorial; Panda exports resolved config only     |
| Invented brand voice           | Generator describes structure and tokens; user writes personality |

### v1 auto prose (default mode)

| Section            | Generator writes                                                                     |
| ------------------ | ------------------------------------------------------------------------------------ |
| Overview           | Preset/package name one-liner + TODO for world reference and audience                |
| Colors             | Bullets: `{name}` (`{hex}`) — `{token.path}`; TODO for semantic roles                |
| Typography         | Text style list with font/size/weight; TODO for hierarchy rules                      |
| Layout             | Breakpoint keys + spacing scale summary; TODO for grid / max-width                   |
| Elevation & Depth  | TODO; pre-fill if `shadows` tokens or layer styles exist                             |
| Shapes             | Radii scale from `rounded:`; note dominant recipe radii if obvious                   |
| Components         | Recipe index: name, variant keys, `defaultVariants`, jsx vs fn hint                  |
| Do's and Don'ts    | Starters: use tokens, use recipes, import from `{importMap}`; TODO                   |
| Agent Instructions | Import paths, `css()` / recipe / pattern names, breakpoint list, 1–2 example prompts |

### Panda extension section

After Do's and Don'ts (non-canonical; spec preserves unknown sections):

```md
## Agent Instructions

- Import styled-system from `{importMap}`.
- Use `css()` for one-offs, `{recipeName}()` for recipes, `{patternName}()` for patterns.
- Breakpoints: {sm, md, lg, …}.
- Don't hardcode colors or spacing — use YAML tokens.
```

Google's linter may warn on `section-order`. That's fine.

## Example output (truncated)

```md
---
version: alpha
name: Acme App
description: Generated from panda.config.ts
colors:
  primary: '#1a202c'
  accent: '#e53e3e'
typography:
  heading:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: Inter
    fontSize: 1rem
    lineHeight: 1.6
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  sm: 8px
  md: 16px
  lg: 32px
components:
  button:
    backgroundColor: '{colors.primary}'
    textColor: '#ffffff'
    rounded: '{rounded.md}'
    padding: 12px
---

## Overview

<!-- TODO: Brand personality, audience, tone. -->

## Colors

- primary (`#1a202c`) — `colors.gray.900`
- accent (`#e53e3e`) — `colors.red.500`

<!-- TODO: CTA, surface, border, error roles. -->

## Do's and Don'ts

- Use YAML tokens — don't invent hex values.
- Use recipes (`button`, `input`, …) — don't one-off component CSS.
- Import styled-system from `{importMap}`.

## Agent Instructions

- Import from `styled-system/css`, `styled-system/recipes`, …
- Breakpoints: sm, md, lg, xl
```

## Using `--check` in CI

`--check` diffs generated output against `--out`. Exit 1 on mismatch — same idea as `panda codegen --check`.

```sh
panda design-md --check
npx -y @google/design.md lint DESIGN.md
```

Or `panda design-md --validate` for both.

`--check` catches token drift. Google's linter catches broken refs and contrast. Prose-only edits survive `--merge`;
YAML changes under edited prose still fail `--check` unless you full regen.

## Hooking into lib and init

### `panda lib --design-md`

Writes `{outdir}/DESIGN.md` next to `panda.lib.json`. Document the path in the package README. Doesn't change the
manifest schema — sibling file for agents, not compiler input.

### `panda init`

Optional prompt:

```txt
Generate DESIGN.md for AI agents? [y/N]
```

Yes → scaffold export + one line in `AGENTS.md` if we generate it.

### MCP

No code changes v1. README can say: DESIGN.md for bootstrap, MCP for lookups. `get_design_md` tool is out of scope.

## Validating output

Don't vendor Google's linter. Shell out:

```sh
npx -y @google/design.md lint <path>
```

Parse JSON for `--validate`. If `npx` fails (offline, private registry), warn — don't fail the export.

Tests in `packages/cli`:

- deterministic YAML for fixtures
- section order and `---` fences
- `--merge` keeps user prose
- `--check` catches token changes

Golden snapshot from a sandbox preset; review when mapping changes.

## Rollout

**P1 — core**

- Command + flags schema
- `generateDesignMd({ spec, theme, config, options })`
- Token / typography / rounded / spacing YAML
- Scaffold prose + Agent Instructions
- `--out`, `--scaffold-only`, `--json`

**P2 — CI and packaging**

- `--check`, `--merge`
- `panda lib --design-md`
- Init prompt

**P3 — richer export**

- `--rich` prose tier (key characteristics, example prompts, iteration guide)
- Semantic token prose helpers
- Recipe state keys in YAML where unambiguous
- `--validate`
- Optional DTCG passthrough via Google CLI (side artifact)

## Diagnostic codes

| Code                         | When                                |
| ---------------------------- | ----------------------------------- |
| `design_md_write_failed`     | Can't write `--out`                 |
| `design_md_check_stale`      | `--check` diff failed               |
| `design_md_merge_conflict`   | `--merge` can't parse existing file |
| `design_md_validate_failed`  | Google lint errors                  |
| `design_md_validate_skipped` | `npx` unavailable (warn)            |

Warnings only: skipped complex recipes, `section-order` from Google lint, missing `primary` color.

## Open questions

- Flatten color keys (`red-500`) vs nested groups for `{ref}` paths? Lean flatten.
- Semantic tokens: separate keys per condition (`primary._dark`) or base YAML + prose for modes?
- `--prose ai` later? Non-deterministic; not P1.
- Watch regen on config change? Probably no — prose is hand-edited; CI `--check` is enough.
- Google spec is alpha — pin `version: alpha`; rerun goldens when bumping `@google/design.md` in dev.

## Related

- [CLI v2 direction](./cli.md)
- [CLI analyze command](./cli-analyze.md)
- [Design-system manifest](./design-system-manifest.md)
- [Output & host layer](./output-and-host-layer.md)
- [DESIGN.md spec](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)
- [DESIGN.md PHILOSOPHY.md](https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md)
- [@google/design.md on npm](https://www.npmjs.com/package/@google/design.md)
- [WebDesignHot/design-md](https://github.com/WebDesignHot/design-md)
- [awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
