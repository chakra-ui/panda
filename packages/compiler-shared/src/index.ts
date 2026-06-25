/**
 * Shared contract for the Panda compiler bindings. `@pandacss/compiler`
 * (native) and `@pandacss/compiler-wasm` (browser) both consume it, so the
 * public surface and the callback runtime live in exactly one place.
 *
 * This module is a barrel; the surface is split by concern:
 * - `./types`      — data-shape contract (the serialized `Compiler` surface)
 * - `./build-info` — the `buildInfo` namespace over binding primitives
 * - `./design-system` — the `designSystem` namespace (`panda.lib.json`)
 * - `./callbacks`  — the JS-callback runtime (`utility.transform`, …)
 * - `./introspect` — the `introspect(spec)` query/sort helper
 * - `./driver`     — the host orchestration layer (`Driver`, `BaseDriver`)
 */

export * from './types'
export * from './build-info'
export * from './design-system'
export * from './callbacks'
export * from './defaults'
export * from './import-map'
export { introspect } from './introspect'
export type { Introspection } from './introspect'
export * from './driver'
