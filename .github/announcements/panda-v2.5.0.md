# Panda v2.5.0

## Added

- Add the `no-dynamic-styling` lint rule, on in `recommended`. It flags style values Panda cannot read at build time, like `css({ color })` with `color` from state, so you see the missing CSS in your editor.
- Add `codegen: false` to the bundler plugins (Vite, Rollup, webpack, Bun, PostCSS) so apps importing a shared styled-system can skip generating a local copy while still generating CSS.

## Changed

- Lint rules now point at, and fix, style values in Vue, Svelte, and Astro template attributes. Before, those values were reported against the whole tag with no fix.
- Clarify the `design_system_option_mismatch` warning: components from a design system render unstyled when your app sets a different `prefix`, `hash`, or `separator`.

## Performance

- Fix slow first builds with the PostCSS plugin in projects with many `include` entries (74s to 8s on 10k sources). The first build now parses every source file in one batch, the way `panda cssgen` does.

## Fixed

- Fix the order of rules whose selectors contain `:has()` or a list of states, so the right one wins. A selector list now ranks as its strongest state, and the lint plugin warns when two conditions on one property cannot keep your written order.
- Fix styles being dropped when a condition reads a variable set by a ternary. Both branches are now extracted, including through `??`/`||` defaults, helper functions, and imports.
- Fix `treeshakeDesignSystem` loading the wrong component styles when several components export the same name, like `Root` in Ark UI based design systems.
- Fix design-system tree-shaking keeping old imports when `parseFiles()` picks up an edited file.
- Fix `no-deprecated` and `panda analyze` reporting a deprecated token when the style used a different token that compiles to the same CSS variable.

Full changelog: https://github.com/chakra-ui/panda/blob/v2/CHANGELOG.md
