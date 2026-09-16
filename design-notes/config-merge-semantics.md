# Config Merge Semantics

## Summary

`extend` decides whether a config adds to what a preset defined or replaces it. Write a theme key under `theme.extend`
and it merges into what's there. Write it directly under `theme` and yours replaces it. Merging happens in
`packages/config/src/merge.ts`, entirely in TypeScript, before `createConfigSnapshot` lowers anything to Rust.

## Replacement lands on the entry you name

`theme.tokens` and `theme.recipes` hold named entries, so a config replaces the entry rather than the key above it.

```ts
theme: {
  tokens: { colors: { brand: { value: '#EA8433' } } },  // colors replaced, spacing untouched
  recipes: { button: myButton },                        // button replaced, card untouched
}
```

`themeRegistryKeys` in `merge.ts` lists the keys this applies to. It is not arbitrary: it records where "the thing you
name" stops for each key. For `recipes` that's the recipe. For `tokens` it's the scale, because naming a single token
would be indistinguishable from merging it.

`breakpoints` is deliberately absent. A breakpoint is a string, so per-entry replacement would equal merging and you
could never drop a preset's set. It replaces whole.

## Ordering

Configs apply in order — presets, then the designSystem chain root-to-leaf, then the user config. Within each config its
base keys apply, then its `extend` keys. Later configs win.

An earlier draft collected every `extend` and applied them after every base, matching v1 and Tailwind. It was reverted:
it let a preset's `extend` override the user's own bare write, which contradicts what writing a bare key means. Your
config outranking a preset matters more than parity here.

## Consequences

A single-level registry can be granular or clearable, not both. Per-entry replacement means you can override one
keyframe but can't drop a preset's whole set; `presets: []` remains the way to start clean. Removing one entry is not
expressible — use a plugin.

Cost is ~0.74ms for both built-in presets plus a user config, called a few times per config load. `preset.ts` calls
`mergeConfigs` at four sites, one inside the designSystem loop, so deep chains re-merge per level.

## Unresolved Questions

- Explicit operators (`replace()`, and `null` to delete) would put intent at the value instead of encoding it
  positionally, removing the need for `themeRegistryKeys` and making removal expressible. Larger change; not scheduled.

## Related

- [design-system-manifest](./design-system-manifest.md)
- [config-loading-design](./config-loading-design.md)
