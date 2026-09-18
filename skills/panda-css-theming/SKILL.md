---
name: panda-css-theming
description: >-
  Design the theme and component-style architecture of a Panda CSS project. Use when setting up theming, adding brand
  colors, wiring dark mode or a color-mode toggle, shipping more than one theme with theme.themes, staticCss.themes,
  data-panda-theme or injectTheme, naming or restructuring design tokens, deciding what belongs in tokens vs
  semanticTokens vs textStyles vs a recipe, designing a component's variant API, or deciding whether something should be
  a css() call, a cva, a config recipe, or a slot recipe, including converting a recipe into a slot recipe. Also use
  when tokens or recipes have grown messy and need a cleanup plan. Do not use for writing styles against a system that
  already exists (use panda-css), or for upgrading v1 to v2 (use panda-css-migrate).
---

# Panda CSS theming and system design

This is the architecture layer. What a token is called, which layer it lives in, and when a style graduates from a call
site to a recipe. These choices are hard to reverse once a codebase has a few hundred call sites.

Two questions answer most of it:

- **Does this value have meaning, or is it just a value?** Meaning goes in `semanticTokens`.
- **Does anyone outside this file need to vary this?** If yes, it's a recipe. If no, it's `css()`.

## Vocabulary

Use these words exactly. Panda's config keys are named after them, so a loose word here turns into the wrong config key
later. Each entry says what to avoid and why.

**Primitive token**: a raw scale value under `theme.tokens`, named for what it is (`blue.500`, `spacing.4`). _Avoid_:
"variable" (Panda emits CSS variables from tokens, they are not the same thing), "base token" (reads as `{ base: … }`,
which is a condition).

**Semantic token**: a value under `theme.semanticTokens`, named for the role it plays (`fg.muted`, `danger`), and free
to change per condition. _Avoid_: "alias" (an alias implies one fixed target, a semantic token can hold a different
value per condition), "theme variable".

**Composite style**: a named bundle of properties under `textStyles`, `layerStyles`, or `animationStyles`. _Avoid_:
"preset" (a preset is a shareable config package in Panda, a different thing entirely), "mixin".

**Recipe**: a component's styles plus its variants, from `cva` in a file or `theme.recipes` in config. _Avoid_: "variant
function", "style object" (a style object is the plain argument you pass to `css()`).

**Slot**: one named part of a slot recipe, styled independently. _Avoid_: "part", "element", "sub-component". The config
key is `slots`, so any other word loses the thread.

**Anatomy**: the full list of slots a component exposes. It is public API. _Avoid_: "structure", "shape".

**Variant axis**: one key under `variants` (`size`, `visual`), holding the options along that axis. _Avoid_: "prop"
(props are what the consumer passes, an axis is what you define), "modifier".

**Compound variant**: a rule that fires when a specific combination of axes matches. _Avoid_: "combo variant",
"multi-variant".

**Pattern**: a reusable layout function (`stack`, `grid`, `container`). _Avoid_: calling a pattern a component, and
calling a recipe a pattern. Panda ships both words with separate meanings and separate config keys.

**Condition**: a state or media selector key (`_hover`, `_dark`, `md`). _Avoid_: "modifier", "pseudo" (conditions cover
media queries and selectors too).

## Step 1: read what exists

1. `panda.config.ts`: `presets`, `theme`, `semanticTokens`, `conditions`, `strictTokens`, `designSystem`.
2. `<outdir>/types/tokens.d.ts`: every token name that currently resolves.
3. `<outdir>/specs/design-system.json`: the same tokens with their values, conditions, recipes, and which preset each
   one came from. See [The design system spec](#the-design-system-spec).
4. `<outdir>/recipes/`: what's already a recipe.
5. Grep a few call sites for the property you're about to tokenize. If eight files already write `gray.600` for
   secondary text, that's the semantic token you're missing.

Don't design in a vacuum. Presets (`@pandacss/preset-base`, `@pandacss/preset-panda`) already ship scales. Extend them
rather than replacing them.

## The token layers

Four layers, each with a different job. Put a value in the highest layer that still describes it honestly.

**1. Primitive tokens** live in `theme.tokens`. Raw scale values with no opinion about use.

```ts
tokens: {
  colors: { blue: { 500: { value: '#3b82f6' } } },
  spacing: { 4: { value: '1rem' } },
}
```

Rules: a full scale, not the three shades you need today. Named by what it _is_ (`blue.500`), never by what it's for.
Nothing in a primitive name should mention a component.

**2. Semantic tokens** live in `theme.semanticTokens`. What a value _means_, and how it changes per condition.

```ts
semanticTokens: {
  colors: {
    fg: { value: { base: '{colors.gray.900}', _dark: '{colors.gray.50}' } },
    'fg.muted': { value: { base: '{colors.gray.600}', _dark: '{colors.gray.400}' } },
    danger: { value: '{colors.red.600}' },
  },
}
```

Rules:

- This is the only sane place to handle light/dark. Pair both values in one token; never branch `_dark` at call sites
  you could have branched once here.
- Name by role: `fg`, `fg.muted`, `bg.subtle`, `border`, `danger`. Not `gray600Text`, not `buttonBlue`.
- A token used by exactly one component is a recipe value, not a semantic token. Promote it when the second consumer
  appears, not before.
- Reference primitives with `{colors.gray.900}`. Don't paste hex into a semantic token.

**3. Composite styles** are `textStyles`, `layerStyles`, and `animationStyles`. Named bundles of properties that travel
together.

```ts
textStyles: {
  heading: {
    h1: { value: { fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1.2' } },
  },
}
```

Use one when the same three-to-five properties always appear together and carry a name your team already says out loud.
If it needs variants, it's a recipe instead.

**4. Recipes** are component styles with variants. See below.

### Naming

- Role over appearance. `danger` survives a rebrand; `red` doesn't.
- Dots for hierarchy: `fg`, `fg.muted`, `fg.subtle`. Panda flattens them into one namespace, so the prefix is the group.
- Pick one axis and stay on it. Mixing `bg.subtle` with `subtleBackground` in the same theme costs more than either
  choice.
- Watch keyword collisions. A token named `normal` in `lineHeights` shadows the CSS keyword. Rename the token.

## Themes and color mode

Semantic tokens hold both values. Something still has to decide which one applies.

### Color mode

With the base preset, `_dark` means "inside an element carrying the `dark` class". Toggle the class, every semantic
token flips, and no component knows it happened.

```html
<html class="dark"></html>
```

To match a data attribute as well, redefine the condition. This is a config change, so run codegen after it.

```ts
conditions: {
  extend: {
    dark: '.dark &, [data-theme="dark"] &',
  },
}
```

Don't reach for a `useColorModeValue`-style hook or branch in the component. The condition is the mechanism.

### More than one theme

`themes` holds alternative token values behind one attribute. Override only what differs from the default, and keep both
modes on every value you override.

```ts
themes: {
  gothic: {
    semanticTokens: {
      colors: {
        canvas: { value: { base: '{colors.gray.100}', _dark: '{colors.black}' } },
        accent: { value: { base: '{colors.purple.700}', _dark: '{colors.purple.300}' } },
      },
      radii: { control: { value: '{radii.none}' } },
    },
  },
}
```

```html
<html data-panda-theme="gothic"></html>
```

Theme and mode are separate axes. `data-panda-theme` picks the theme, the `dark` class picks the mode inside it, and
they stack. A theme applies to the element carrying the attribute and everything under it, so you can put one theme on
`<html>` and a different one on a panel inside it.

### Shipping themes

Panda emits nothing for `themes` until you say how to ship them. Two options, and they're independent.

**In the main stylesheet.** List them in `staticCss.themes`. Each becomes a block of variables in the `tokens` layer
holding only what it overrides. No runtime, one request, and every page pays for every theme.

```ts
staticCss: {
  themes: ['matcha', 'gothic'],
}
```

**On demand.** `<outdir>/themes` carries each theme as its own JSON file, fetched when asked for. Choose this when there
are many themes, or the user picks one at runtime.

```ts
import { getTheme, injectTheme } from '../styled-system/themes'

const theme = await getTheme('gothic')
injectTheme(document.documentElement, theme)
```

`injectTheme` sets `data-panda-theme` on the element and appends a `<style>` with the theme's variables.

### Deciding

- One look, light and dark: semantic tokens with `_dark`. No `themes` block.
- A handful of fixed brands: `themes` plus `staticCss.themes`.
- Many themes, or user-chosen at runtime: `themes` plus `getTheme` / `injectTheme`.

A theme that overrides most of the token set is usually a sign the semantic layer is too thin. Themes should override
roles, not rebuild the scale.

## The design system spec

The spec is opt-in. Pass `--spec` to `panda codegen`, `panda build`, or `panda lib` and it writes
`<outdir>/specs/design-system.json`. `--spec=<file>` puts it somewhere else. Without the flag, no file is written, and
`panda dev` doesn't take it at all.

It is the whole resolved system in one file, with no server and no MCP:

- `schemaVersion`, and `categories` mapping each token category to its slice of `paths`
- `paths` plus `tokens`, giving every token's category and `cssVar`
- `values`, pairing each token to its resolved value (`animations.spin` is `spin 1s linear infinite`)
- `conditions`, with the real selector behind each name (`_hover` is `&:is(:hover, [data-hover])`)
- `sources`, naming the preset or file each token came from, which `tokens[path].source` indexes into
- `themes`, and, when the project defines them, `recipes`, `slotRecipes`, `patterns`, `textStyles`, `layerStyles`,
  `animationStyles`, `keyframes`, and `colorPalettes`. Empty sections are omitted.

Read it when you need a token's value, its CSS variable, or which preset defined it. For the cheaper question of whether
a name exists at all, `<outdir>/types/tokens.d.ts` is a union type and faster to grep.

If the file isn't there, the usual reason is that nobody passed `--spec`, not that codegen failed. Run
`panda codegen --spec`. Don't fall back to reading `panda.config.ts` instead: it holds what someone wrote, not what
Panda resolved after presets merged, and with `@pandacss/preset-base` and `@pandacss/preset-panda` in play most of the
token set never appears there.

If it is there but stale, it was written by an earlier run. Nothing refreshes it automatically, so
`panda codegen --spec` again.

Auditing a theme starts here. Tokens whose `source` is a preset are inherited, so a project's own additions are the ones
with a local source, and that difference is usually where the drift lives.

### Writing a DESIGN.md from it

If a team wants a human-readable brief for agents, build it from this file rather than by hand. The spec supplies every
fact: token names, values, conditions, recipe variants, and provenance. What it cannot supply is intent, which is when
to reach for `fg.muted` over `fg`, which scales are off limits, and what the brand refuses to do.

Write the intent, generate the rest, and say in the file which spec run it came from. Don't hand-copy token values into
prose. They go stale the next time someone edits the theme, and regenerating is one `panda codegen --spec`.

A project that wants this regularly should put `--spec` on the build script rather than relying on someone remembering
the flag.

## When a style becomes a recipe

A ladder. Climb one rung at a time, and only when the test passes.

**`css({ … })` at the call site.** Where everything starts. Stay here while the style is used once.

↓ _the same style object appears in three or more places_

**`cva` in the component file.** A local recipe with variants, colocated with its only consumer.

```ts
import { cva } from '../styled-system/css'

const button = cva({
  base: { px: '4', py: '2', rounded: 'md' },
  variants: {
    visual: { solid: { bg: 'accent' }, outline: { borderWidth: '1px' } },
    size: { sm: { fontSize: 'sm' }, md: { fontSize: 'md' } },
  },
  defaultVariants: { visual: 'solid', size: 'md' },
})
```

↓ _consumers outside this file need the variants, or the styles belong to the design system rather than the component_

**Config recipe.** `defineRecipe` in `panda.config.ts` under `theme.recipes`. Now the variant API is part of the system,
types are generated, and the CSS is emitted from config.

↓ _the component renders more than one element and each needs its own styles_

**Slot recipe.** `defineSlotRecipe` under `theme.slotRecipes`, or `sva` in a file.

Don't climb a rung you don't need. A config recipe for a style used in one file is indirection with a typing cost.

### When it's a slot recipe

Use slots when the component renders parts a consumer can style or replace independently: root, trigger, content, title,
indicator. Signals:

- You're passing `className` down to inner elements to style them.
- You wrote a nested selector reaching into a child component's markup.
- Two elements need to react to the same variant differently.

```ts
const card = sva({
  slots: ['root', 'header', 'body'],
  base: {
    root: { rounded: 'lg', borderWidth: '1px' },
    header: { px: '4', py: '3', borderBottomWidth: '1px' },
    body: { px: '4', py: '4' },
  },
  variants: {
    density: {
      compact: { header: { py: '2' }, body: { py: '2' } },
    },
  },
})
```

Design the anatomy first. Name the slots before you write styles. The slot list is public API, so renaming one later
breaks every consumer.

**Converting a recipe to a slot recipe:** list the elements the component renders, name each one, move each block of
styles under its slot, then move variants so each variant names the slots it touches. `base` and every variant go from a
flat style object to a map keyed by slot. Then switch consumers from `createRecipeContext` to `createSlotRecipeContext`.

### Consuming recipes in JSX (v2)

- `createRecipeContext(recipe)` returns `{ withContext }`, for a `cva` recipe.
- `createSlotRecipeContext(recipe)` returns `{ withRootProvider, withProvider, withContext }`, for `sva`.
  `withRootProvider` is for a root that doesn't render a slot of its own.

Both come from `<outdir>/jsx`. v1's single `createStyleContext` is gone.

## Designing the variant API

- **Name variants by intent, not implementation.** `visual`, `size`, `tone`. Not `isBlue`.
- **Always set `defaultVariants`.** Without them a consumer who passes nothing gets base styles only. A variant passed
  as a runtime prop emits base plus defaults only anyway.
- **Boolean variants** are `true` / `false` keys. Keep them for genuinely binary things.
- **Compound variants cost CSS.** Each combination emits. A matrix of 4 visuals by 4 sizes by 3 tones is 48 potential
  blocks. In v2 compound variants emit eagerly at build time. Set `optimize.smartCompoundVariants: true` to narrow the
  output to combinations actually used.
- **Prefer more variants over more compound variants.** If you need a compound rule for most cells of the matrix, the
  axes are wrong.
- **Responsive variant values** work (`size={{ base: 'sm', md: 'md' }}`), but only for extracted literals.

For exported components under `isolatedDeclarations`, annotate with the variant keys so the CSS stays out of the
`.d.ts`:

```ts
import type { RecipeRuntimeFn } from '../styled-system/types'

export const button: RecipeRuntimeFn<{ visual?: 'solid' | 'outline' }> = cva({ … })
```

`SlotRecipeRuntimeFn` and `StyledComponent<Tag, Props>` do the same for `sva` and `styled`.

## Anti-patterns

- **A theme that's one flat pile of primitives.** If call sites all reference `gray.600`, a rebrand becomes a
  find-and-replace across the app. That's what the semantic layer prevents.
- **Component names in global tokens.** `colors.buttonPrimary` means every future component invents its own. Name the
  role, not the consumer.
- **Redefining scales per component.** A recipe whose `base` re-declares spacing values is drifting from the theme.
- **Page layout inside a recipe.** Recipes are for components. Page composition is `css()` and patterns.
- **Dark mode branched at call sites.** One `_dark` in a semantic token beats fifty in components.
- **Slots added defensively.** Slots you don't style are API you have to keep.

## After changing the config

Run `panda codegen` (or `panda build`). Tokens, recipes, and their types don't exist until it does. Then read the CSS
diff. A token rename that silently drops a value shows up as CSS that stopped emitting.

## It's working if

- A rebrand touches the config, not the call sites.
- `_dark` appears in `theme.semanticTokens` and almost nowhere else.
- Switching the `dark` class or `data-panda-theme` changes the page, and no component reads either one.
- Every theme in `themes` is either listed in `staticCss.themes` or loaded through `getTheme`, so none emits nothing.
- Grepping a primitive like `gray.600` across components returns close to nothing.
- Every slot in a recipe's `slots` array has styles under it.
- No token name contains a component name.
- `panda codegen` runs clean, and the emitted CSS for a recipe matches the variants you meant to ship.

## See also

- Writing styles against the system you designed: call the Skill tool with "panda-css".
- v1 to v2, including the `createStyleContext` split: call the Skill tool with "panda-css-migrate".
