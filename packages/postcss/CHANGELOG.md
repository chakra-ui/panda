# @pandacss/postcss

## 2.0.0-beta.9

### Patch Changes

- Design-system build info loads more reliably when packages are nested, files are stale, or options do not
  match. You get clearer errors for token conflicts and mismatched config.

## 2.0.0-beta.8

### Patch Changes

- Fix PostCSS HMR style updates.

  Component edits now keep previous atoms available during refresh, and design-system source fallback files refresh
  through the driver instead of waiting for a restart.

## 2.0.0-beta.7

### Patch Changes

- Fix hot module reloading with the PostCSS integration (`@pandacss/dev/postcss`). Editing a component now
  updates its styles live, instead of leaving them stale until you restart the dev server.

## 2.0.0-beta.0

### Patch Changes

- Add an experimental PostCSS integration backed by the v2 compiler driver.
