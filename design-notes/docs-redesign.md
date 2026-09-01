# Docs redesign

Restructure the Panda website so a reader can pick a part of Panda and start building. Layout parity with
[bun.com/docs](https://bun.com/docs); visual identity our own.

**Base:** `upstream/v2`. **Scope:** `website/` only — no compiler, CLI, or package changes.

## Why

Three problems, in order of how much they cost a reader.

1. **Nothing lands anywhere.** Every tab root 301s straight into a leaf page (`next.config.mjs`). `/docs/styling`
   redirects to `getting-started`, `/docs/theming` to `tokens`. There is no overview page anywhere in the docs, so
   there is no way to see what a section contains before entering it.
2. **The chrome moves while you read.** Seven confirmed layout-shift and motion defects, catalogued below. The worst
   one smooth-scrolls the table of contents continuously while you scroll the page.
3. **The text is too small and the pages don't match.** Base font resolves to 14.4px. Four different card
   implementations. The blog looks like a different site from the docs.

## What bun actually is

`website/docs.json` on bun's repo declares `"theme": "aspen"` — their docs are Mintlify's hosted Aspen theme with zero
custom components. The whole visual layer is `style.css`, roughly 200 lines, mostly nudges.

So the visual layer is not what to copy — copying it lands on "generic docs site". What to copy is the information
architecture and one mechanical discipline:

**Nothing in bun's chrome ever changes size.** Every state change is a colour swap on a box that already occupies its
final space. Two lines in their `style.css` exist purely to guarantee it:

```css
.ring-transparent { border: 1px solid transparent !important; }  /* reserve the border */
ul#sidebar-group > li > a { font-weight: 500; }                  /* every item, active or not */
```

Active sidebar items in bun are not bolder. They are white instead of grey. That is the entire trick.

Two things not to copy: they repeat Guides / Reference / Blog in both nav rows (patched with
`a[href="/guides"] { margin-left: auto }`), and their welcome page's "What's Inside" is a bullet list restating the
cards directly above it.

---

## 1. Information architecture

Three tiers. The tier decides placement.

```
TIER 1 — header row 1, every page
  Docs · Guides · Reference · Blog · Playground     [search]  gh  discord  [Get started]

TIER 2 — header row 2, /docs only
  Styling · Recipes · Theming · Design Systems · Compiler · Tooling

TIER 3 — footer directory, every page
  LEARN          TOOLKIT          COMMUNITY      PROJECT
  Documentation  ESLint / Oxlint  Discord        Showcase
  Guides         Editor & IDE     GitHub         Team
  Reference      MCP server       Discussions    Brand kit
  Blog           Studio           Contributing   Changelog
  Install        Playground       Feedback       License
```

Nothing appears in two tiers. Guides and Reference sit in row 1, not row 2, because they are *modes of reading* rather
than *parts of the product* — the distinction bun blurred. Row 2 renders under `/docs` only; the blog and the
standalone pages get row 1 alone, matching bun.

### The six tabs

Grounded in the v2 package set (15 packages) and the 122 pages under `website/content/docs/`.

| Tab | Covers | v2 packages |
|---|---|---|
| Styling | `css`, style props, styled factory, conditions, responsive, global, layers, dynamic, merging | preset-base, preset-panda |
| Recipes | `cva`, `sva`, slot recipes, compound variants, recipe context, patterns | — |
| Theming | tokens, semantic tokens, text / layer / animation styles, themes, virtual colour | — |
| Design Systems | presets, component libraries, `forwardProps`, publishing, monorepo, federated MFE | dev, types |
| Compiler | how Panda works, extraction, static CSS, performance, CLI (9 commands), PostCSS, Vite | compiler, compiler-wasm, compiler-shared, cli, config, postcss, vite |
| Tooling | ESLint / Oxlint, editor & IDE, MCP, agent skills, llms.txt, Studio, Playground | eslint-plugin, language-server, typescript-plugin, mcp |

Recipes and Compiler are promoted out of Styling, where they are buried today — Recipes is currently the fourth item in
a group called "Styling APIs". Tooling is promoted out of Reference.

Six tabs give the welcome page a 3×2 card grid. Bun runs eight items in row 2, so six is comfortable.

### Standalone pages

Full width, no sidebar, no row 2: **Install**, **Showcase**, **Ecosystem**, **Brand kit**, **Team**.

**Feedback** is a docs page, not a standalone. The content is a numbered procedure; `mdx/steps.tsx` already renders it.
Bun reached the same conclusion — their feedback page is a plain docs page with a one-item sidebar.

---

## 2. Design system

### 2.1 Typography

The cramping has a single root cause, declared twice:

```
theme/global-css.ts:9    html { fontSize: '0.9em' }
app/layout.tsx:26        <html className={css({ fontSize: '0.9em' })}>
```

`0.9em` on the root resolves against the browser default of 16px, so the whole site renders at **14.4px base**. Every
`textStyle: 'sm'` on top of that lands near 12.6px. It also overrides the reader's own browser font-size preference,
which is an accessibility failure independent of taste.

Remove both. Anchor the scale to `rem`.

| Role | Size | Line height | Notes |
|---|---|---|---|
| Body | 16px (`1rem`) | 1.7 | from 14.4 / ~1.5 |
| Prose measure | 68–72ch (~720px) | — | currently unbounded except on the page description |
| h1 | 44px condensed | 1.05 | no rule |
| h2 | 30px condensed | 1.15 | hairline rule under, 4rem top margin |
| h3 | 21px | 1.3 | |
| Small / meta | 14px | 1.5 | floor — nothing below 14 |
| Eyebrow | 12px mono, `0.08em` tracking, uppercase | — | |
| Inline code | 0.9em mono, bordered chip | — | |

Headings take a condensed grotesk. It is bun's single strongest identity move — "Welcome to Bun", "Install Bun",
"Press kit", "Blog" are one compressed face — and it is what makes an otherwise plain page read as designed.

**The eyebrow is the second identity device.** Bun uses mono-caps-tracked labels everywhere: `ON THIS PAGE`, `FEATURED`,
`NEXT`, `MODULES`, `INSTALL · V1.4.0`, `NEW PROJECT`, `BRAND`, `RELEASE`, and every footer column header. Adopt it
wholesale — breadcrumbs, TOC header, pagination, card kickers, blog dates, footer columns, page kickers. It costs
nothing and is the cheapest way to make eleven pages read as one site. Our breadcrumbs are already uppercase; that is
the seed.

### 2.2 Colour — Highlighter

The constraint, precisely: **`yellow.400` `#facc15` on white is ~1.6:1.** It cannot be text, a link, or an icon on a
light background. This is why the palette currently escapes to blue for links and flips `fg.headline` to black in light
mode — those are workarounds for a rule the system never stated.

State the rule: **yellow is a surface, never a foreground.**

| Use | Light | Dark | Contrast |
|---|---|---|---|
| Body text | `neutral.800` on white | `neutral.200` on `#0d0d0d` | 12.6:1 / 13.1:1 |
| Muted text | `neutral.600` | `neutral.400` | 5.9:1 / 7.2:1 |
| Border / rail (rest) | `neutral.200` | `white/10` | 3.1:1 (non-text) |
| Rail (active) | `yellow.500` | `yellow.300` | 3.4:1 / 11:1 (non-text) |
| Highlight wash | `yellow.100` | `yellow.300/15` | ink on it stays 11:1+ |
| Link | ink + 1px accent underline | same | underline is the affordance |
| Focus ring | `blue.500` 2px, 2px offset | `blue.400` | 3:1 both grounds |

Where bun uses pink *as* text, we use yellow *as* a mark — behind the active nav item, under the active tab, as the rail
beside the current sidebar entry, behind inline code, behind the `LATEST` chip. That highlighter swipe is our shape
signature. We do not need bun's notched button corner; the mark does double duty as the active-state mechanism.

**One sanctioned exception.** Bun's install page is the only place on their site that glows — the selected OS card gets
a pink border and a glow, spent deliberately on the highest-value action. Ours gets the same allowance: the Install
page's package-manager picker takes a yellow wash fill plus border. One exception, one page.

### 2.3 Motion contract

> **No interactive state may change an element's box.** Not width, height, font-weight, padding, border-width,
> position, or scale. State changes are `color`, `background-color`, `border-color`, `opacity`. 150ms, colour
> properties only, disabled under `prefers-reduced-motion`.

Corollaries: every optional border is `1px solid transparent` at rest; active indicators are drawn at rest and only
change colour; nothing auto-scrolls while the user is scrolling; `scrollbar-gutter: stable` on `html`, permanently.

Enforced by a lint rule banning `transform`, `boxShadow`, and `fontWeight` inside `_hover` / `_current` / `_active`
under `website/`.

### 2.4 The seven defects

| # | Where | Defect |
|---|---|---|
| 1 | `components/docs/sidebar.tsx:26,33` | `fontWeight: normal` → `_current: semibold`. Active item re-measures; a wrapping label jumps a full line height. |
| 2 | `components/ui/toc.tsx:244` | Same weight change, on an `inline-flex` box that resizes with it. |
| 3 | `components/ui/toc.tsx` | Scroll-spy collects `activeIds` as a `Set` and marks *every* visible heading active. A band of items bolds and unbolds continuously while scrolling. |
| 4 | `components/ui/toc.tsx:158` | `scrollIntoView({ behavior: 'smooth' })` inside a `useEffect` keyed on `headingStates`, which gets a fresh object identity on every IntersectionObserver tick. The TOC smooth-scrolls itself repeatedly while you scroll, each animation interrupting the last. **This is the jitter.** |
| 5 | `theme/global-css.ts:58` | `scrollbarGutter: 'auto'` on `.scroll-area`, nothing on `html`. Content jumps horizontally between short and long pages. |
| 6 | `theme/recipes/card.recipe.ts:24,32,36` | `boxShadow: 'md'` light, `none` dark — two different designs. `_active: { boxShadow: 'sm' }` deflates the card on click. |
| 7 | `app/blog/page.tsx:83` | `_hover: { shadow: 'md', transform: 'translateY(-2px)' }` — the grid ripples under the cursor. |

`TabBar`'s `TabLink` (`components/docs/tab-bar.tsx`) already does it correctly: a persistent `::after` underline that
only changes `background`. That is the pattern to propagate.

### 2.5 Accessibility

Testable commitments, not aspirations.

**Broken today, fixed in phase 1:**

- Sidebar links use `data-current`, not `aria-current`. Screen readers get **no indication of the current page**. Both
  sidebar and TOC take `aria-current="page"`.
- `TabLink` sets `aria-current="true"`; should be `"page"`.
- The sidebar is `as="nav"` with no accessible name. Needs `aria-label`.
- Base font 14.4px → 16px, `rem`-anchored, so browser font-size settings take effect.

**Rules for everything new:**

- Text ≥ 4.5:1, UI and borders ≥ 3:1. Every token in §2.2 carries its number.
- Colour is never the sole signal. The sidebar changes rail *and* text colour; the install picker gets `aria-checked`
  and a check glyph, not only a wash.
- Every segmented control — blog filter, install OS, install method, code tabs — is a real `tablist` or `radiogroup`
  with arrow-key navigation, not a row of buttons.
- Focus ring visible on every interactive element, 2px with 2px offset, 3:1 against both the component and the page.
  `global-css.ts` has this today; it must survive the redesign.
- Minimum target 24×24 (WCAG 2.2 AA). Sidebar rows go to 32px.
- `prefers-reduced-motion` disables all transitions and any smooth scroll.
- `mdx/skip-nav.tsx` exists; wire it to the new shell.
- Showcase screenshots take real alt text, not the project name repeated, and explicit dimensions.

### 2.6 Components

**Card — one component replaces four** (`mdx/cards.tsx`, `mdx/framework-card.tsx`, `theme/recipes/card.recipe.ts`, and
the ad-hoc blog card). Two modes, both taken from bun and confirmed co-existing on their install page:

- *gapped* — icon, title, body, optional CTA row. Gap between cards, uniform height across a group. For things with
  content inside them.
- *gapless* — cells sharing single 1px borders, no gap, mono titles, right-aligned `→`. For lists of destinations. Used
  by bun's Reference index and the "Learn" row on their install page.

No shadow in either mode, in either theme. Hover changes `border-color` only.

**Sidebar** — persistent 1px vertical hairline down each group; the active item swaps a 2px segment of it to accent.
Text goes `fg.muted` → `fg`. Uniform `fontWeight: medium` on every item. Fixed 32px row height.

**TOC** — single active id (last heading whose top has passed the scroll line). Auto-scroll effect deleted, or gated to
navigation only, never to scroll. Same rail treatment as the sidebar so the two columns read as one system.

**Inline code** — bordered chip, bold mono, matching bun's `Buffer` / `node:fs` treatment. High leverage: it appears
hundreds of times per page and currently reads as unstyled.

### 2.7 Shell

```
┌────────────────────────────────────────────────────────────────────┐
│  🐼 Panda   Docs  Guides  Reference  Blog  Playground  [⌕] ⌾ ⌗ [Get]│  64px fixed
├────────────────────────────────────────────────────────────────────┤
│  ◆Styling ◆Recipes ◆Theming ◆Design Systems ◆Compiler ◆Tooling     │  48px fixed
│  ▔▔▔▔▔▔▔▔                                          scoped to /docs │
├──────────┬─────────────────────────────────────┬───────────────────┤
│ │Get Started                                   │  ON THIS PAGE     │
│ ┃Welcome  │  STYLING › GET STARTED   [Copy ▾]  │  ┃Overview        │
│ │Install  │                                    │  │Installation    │
│ │         │  760px — position never changes    │                   │
│ 256px     │                                    │  256px            │
│ own scroll│                                    │  own scroll       │
└──────────┴─────────────────────────────────────┴───────────────────┘
  ┃ 2px active rail, drawn at rest      │ 1px group rail, drawn at rest
```

Three fixed-width columns, each independently scrolled. The middle column's left edge is constant — it does not
recentre when the TOC is absent. Overview pages leave the right column empty rather than reflowing, mirroring bun's
`mode: center` welcome page, which sits at a different but fixed offset.

Both header rows are `position: fixed` with heights as CSS variables, which `app/docs/layout.tsx` already does.

---

## 3. Pages

### 3.1 Welcome to Panda — `/docs`

```
DOCS › GET STARTED                                     [Copy page ▾]

Welcome to Panda
Build modern websites with build-time, type-safe CSS-in-JS.

┌─ ✎ Styling ─────┐ ┌─ ▤ Recipes ─────┐ ┌─ ◈ Theming ─────┐
│ css(), style    │ │ cva, sva, slot  │ │ Tokens, text &  │
│ props, patterns │ │ recipes         │ │ layer styles    │
│ Start with      │ │ Start with      │ │ Start with      │
│ css() →         │ │ cva() →         │ │ tokens →        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─ ⬢ Design Sys ──┐ ┌─ ⚙ Compiler ────┐ ┌─ ⚒ Tooling ─────┐
└─────────────────┘ └─────────────────┘ └─────────────────┘
──────────────────────────────────────────────────────────────
Get Started
┌─ ⤓ Install Panda ─┐ ┌─ ⚡ Quickstart ───┐
```

Six cards 3×2, hairline, the Get Started pair, then prose. Bun's welcome minus the redundant "What's Inside" list.

Requires six `overview.mdx` files and deleting the six bare-root redirects in `next.config.mjs`.

### 3.2 Install — `/install`

```
                    INSTALL · V2.0.0
                   Install Panda
       One command. Your styled-system generated in seconds.

        ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
        │  pnpm  │ │  npm   │ │  yarn  │ │  bun   │   radiogroup
        └────────┘ └────────┘ └────────┘ └────────┘   yellow wash = active

           [ React ][ Vue ][ Svelte ][ Solid ][ Astro ]  segmented

        $ pnpm add -D @pandacss/dev && panda init   [copy]

                         Advanced installation options →
──────────────────────────────────────────────────────────────
Then, build something
┌ NEW PROJECT ────┐ ┌ EXISTING APP ───┐ ┌ MIGRATING ──────┐
│ Start from zero │ │ Add to your app │ │ From Tailwind   │
│ $ panda init    │ │ $ panda init    │ │ $ panda init    │
│ Quickstart →    │ │ Setup guide →   │ │ Migration →     │
└─────────────────┘ └─────────────────┘ └─────────────────┘

Learn
┌─Documentation →─┬─Guides →──┬─Reference →──┬─Discord →──┐  gapless
```

Two pickers, not bun's one, because Panda's install genuinely varies by framework and that variation is currently
buried behind tabs on the Installation doc page. Both are real radiogroups. The command block has a fixed height so
switching framework does not reflow the page.

### 3.3 Ecosystem — `/ecosystem`

Doubles as the Tooling tab's overview page — same content, two entrances.

```
                    ECOSYSTEM
              Everything around Panda
   Lint, edit, and generate with the rest of your toolchain.

LINT
┌─ @pandacss/eslint-plugin ─┐ ┌─ oxlint ──────────┐
│ Catch mistakes the        │ │ Same rules,       │
│ compiler doesn't error on │ │ Rust speed        │
│ Read the rules →     beta │ │ Setup →           │
└───────────────────────────┘ └───────────────────┘

EDITOR & AGENTS
┌─VS Code ─┬─ TS plugin ─┬─ MCP server ─┬─ llms.txt ─┬─ Agent skills ─┐  gapless

PRESETS
┌─ preset-panda ─┬─ preset-base ─┐

COMMUNITY
┌─ Park UI ─┬─ Ark UI ─┬─ Tark UI ─┬─ Cerberus ─┐
```

### 3.4 Showcase — `/showcase`

Thirteen real projects with screenshots already live in `public/showcase/` — CoinMarketCap, Contra, Magic Labs, Ark UI,
Park UI, Liquity, Porto and more. Good material, presented as a plain grid today.

```
                    BUILT WITH PANDA
                    Showcase
          Real products shipping on Panda CSS.

┌──────────────────────────────┐ ┌──────────────┐ ┌──────────────┐
│      CoinMarketCap           │ │  Contra      │ │  Magic Labs  │
│      (featured, 2-wide)      │ │              │ │              │
├──────────────────────────────┤ ├──────────────┤ ├──────────────┤
│ CoinMarketCap  CRYPTO DATA ↗ │ │ Contra     ↗ │ │ Magic     ↗  │
└──────────────────────────────┘ └──────────────┘ └──────────────┘
```

Press-kit card structure: image area, hairline, footer row with name left and mono kicker plus `↗` right. First spans
two columns. Hover changes border-colour only, which removes the ripple. `next/image` with explicit dimensions so
nothing shifts on load.

### 3.5 Brand kit — `/brand`

```
▪ BRAND
Brand kit
Vector and raster versions of the Panda logo and wordmark, plus an
icon.svg for small sizes. Please don't stretch, recolour, or restyle
the panda without asking.

[ Download brand kit (.zip) → ]

┌── logo preview ──┬── wordmark ──────┬── icon ──────────┐
│  (dotted grid)   │  (dotted grid)   │  (dotted grid)   │
├──────────────────┼──────────────────┼──────────────────┤
│ Logo  logo.svg   │ Wordmark  ….svg  │ Icon    ….svg    │
└──────────────────┴──────────────────┴──────────────────┘

Colours
┌─ #facc15 ─┬─ #0d0d0d ─┬─ #fef9c3 ─┬─ #ffffff ─┐
│  Yellow   │   Ink     │  Wash     │  Paper    │
└───────────┴───────────┴───────────┴───────────┘
```

One card component in both rows — preview fill versus solid fill. Swatch labels sit outside the colour block, so hex
text never has to be legible against an arbitrary background. Bun got this right; copy it deliberately.

### 3.6 Team — `/team`

Bun has no team page, so there is nothing to copy. The current page is five avatar cards. Panda's actual story is a
small core team plus contributions from hundreds of people; design for that.

```
                    MAINTAINERS
                    Team
    Panda is built by a small core team and a large community.

┌───────────────────────────────────────────────────────────┐
│  ◯  @segunadebayo      CREATOR & MAINTAINER       gh↗ x↗  │
├───────────────────────────────────────────────────────────┤
│  ◯  @astahmer         CREATOR                     gh↗ x↗  │
├───────────────────────────────────────────────────────────┤
│  ◯  @cschroeter       CREATOR @ PARK UI           gh↗     │
└───────────────────────────────────────────────────────────┘
          gapless rows, mono-caps role, not cards

Contributors
┌────────────────────────────────────────────────────┐
│ ◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯ │  avatar wall
└────────────────────────────────────────────────────┘
                    Contribute →
```

Rows rather than cards: a five-card grid always leaves an awkward gap, and rows scale to eight maintainers without a
redesign. `lib/github-utils.ts` already fetches GitHub users, so the contributor wall is a small extension. Avatars
need fixed dimensions or the wall shifts as it loads.

### 3.7 Feedback — `/docs/feedback`

A docs page. Numbered steps, one callout pointing at Discord, links to the issue templates. `mdx/steps.tsx` exists.
Hours, not a design project.

### 3.8 Blog

```
Blog                                                   ⌁ RSS

┌──────────────────────────────────────────────────────────────┐
│ [LATEST] AUGUST 2026 · RELEASE                               │
│ Panda CSS 2.0                                                │
│ A Rust compiler, 31× faster static CSS, …                    │
│ AUTHORS                                                [→]   │
└──────────────────────────────────────────────────────────────┘

[Everything] Articles  Releases                      5 posts

 2026    AUG 2026    Panda CSS 2.0            [RELEASE]
                     A Rust compiler, 31× faster static CSS
         ─────────────────────────────────────────────────
         JUL 2026    Styling Base UI with Panda
```

Giant condensed wordmark, featured card with a `LATEST` chip and mono date, segmented filter with a post count, then a
year-gutter list of hairline-separated rows. Full width, no `bg.muted` panel, so it sits in the same world as the docs.
The filter swaps only the list body — the wordmark and featured card are static, which is why bun's filter feels
instant.

Carries the v2 release post (branch `blog/panda-css-2-release`, PR #3752). That post is the reason this page matters.

---

## 4. Reference as an agent surface

References exist mainly for agents to work from. That is a design constraint and it points somewhere specific.

Bun's Reference is generated from their TypeScript definitions — "Every API, from the types". Ours is 28 hand-written
MDX files covering 21 utility categories plus config, CLI, diagnostics and deprecations. They drift from the source
the moment a utility changes.

Reference becomes **generated from Panda's own registries**: the utility map, the config types in `packages/types`, and
the CLI's zod schemas in `packages/cli/src/schema.ts`. One source, three consumers — the HTML pages, `llms.txt`, and
the MCP server. All three routes already exist (`app/llms.txt`, `app/llms-full.txt`, `packages/mcp`); they are fed by
hand-written prose today.

Visually: gapless grid index, flat mono sidebar with no group headers, `Copy page` on every page, mono-first type.
Optimised for scanning and copying rather than reading.

**This is the largest single piece of work here and it is separable.** It must not block the visual work.

---

## 5. Phasing

| Phase | Work | Notes |
|---|---|---|
| **1** | Motion contract, the seven defects, `aria-current`, 16px base, lint rule | Pure bug fixes, no visual change. Its own PR. |
| **2** | Type scale, eyebrow system, Highlighter tokens, one Card in two modes, footer directory | Everything after inherits this. |
| **3** | Six overview pages, delete root redirects, nav restructure | The progressive disclosure. |
| **4** | Blog rebuild, v2 release post lands on it | |
| **5** | Install, Ecosystem, Showcase, Brand kit, Team, Feedback | Layout work, not design work, once phase 2 lands. |
| **6** | Generated Reference | Separate project. Blocks nothing. |

## Non-goals

- No compiler, CLI, or package changes. `website/` only.
- No new dependency for the shell. Panda styles the Panda site.
- No animation library. The motion contract forbids the things one would be used for.

## Open

- Condensed grotesk for headings — needs a licence decision and a fallback stack.
- Whether `/ecosystem` and the Tooling overview share one MDX source or duplicate.
