# Panda v2.6.0

## Added

- Add the `no-unsafe-token-fn-usage` lint rule, on in `recommended`. It flags style values like `'{colors.red.500}'` or `token('colors.red.500')` where the token name `'red.500'` works, and only when the swap keeps your CSS the same.
- Add `useClassNames` to `createSlotRecipeContext`. It returns each slot's class name, for parts that render their own markup.
- `@pandacss/dev` now ships Panda's agent skills under `skills/`, so pnpm 12.11+ can link them after `pnpm approve`.
- `@pandacss/dev` re-exports preset authoring types like `UtilityConfig` and `RecipeConfig`, so presets no longer need `@pandacss/types`.

## Changed

- Warn about unknown conditions, like `_hover` without a preset that defines it, in recipes, slot recipes, `globalCss`, `textStyles`, `layerStyles`, and `animationStyles`.
- Opening a `panda studio` link from an earlier run now tells you the link is out of date and lets you copy the command to start again.

## Fixed

- Fix `panda cssgen --splitting` emitting an invalid `styles.css` that browsers partly ignore and Turbopack fails to parse.
- Fix design system patterns and recipes ignoring your app's conditions, breakpoints, utilities, or tokens.
- Fix spacing of custom blocks inside `prose`, and the top margin of the first block and `.lead` paragraphs with `notProse`.
- Fix CommonJS presets built with `tsc` failing to load, or being silently ignored, in a `"type": "module"` project.
- Fix `panda.config.ts` failing to load tsconfig path aliases when the tsconfig doesn't include the config file.
- Fix edits to existing source files falling back to a full page reload in Vite after a new source file is created while the dev server runs.
- Fix watch rebuild failures caused by unrelated binary files such as `.DS_Store`.
- Fix `consistent-property-style` rewriting a pattern's own property when it shares a name with a utility shorthand.
- Fix missing token and property completions inside `variants` in `styled(Component, { variants })`.
- Fix false `panda_call_unextractable` warnings on the generated `cva.js` and `sva.js` with `transform: true`.
- Fix Solid `withContext` parts not updating when the root's variant props change.

Full changelog: https://github.com/chakra-ui/panda/blob/v2/CHANGELOG.md
