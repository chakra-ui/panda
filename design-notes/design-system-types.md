# Design system types: one style type per program

## Problem

A design system ships its own `styled-system/types`, and its components import them relatively (`../types/system`). An
app that consumes it emits its own merged `types/`. As soon as the app adds tokens, keyframes, conditions or utilities,
the two `SystemStyleObject`s disagree, so app styles (`css.raw()`, a token the app added) aren't assignable to
design-system props (#4029).

Module augmentation can't widen the design system's types directly: they are closed literal unions and type aliases, and
augmentation only merges interface members.

## Design

The `Register` pattern from TanStack Router
(`declare module '@tanstack/react-router' { interface Register { router } }`): types look up whatever the consumer
registers, instead of being merged into.

Every generated styled-system emits `types/register`:

```ts
export interface Register {}
export type Registered<K extends PropertyKey, Local> = Register extends { system: infer System }
  ? K extends keyof System ? System[K] : Local
  : Local
export interface PandaSystem { Conditions: Conditions; SystemProperties: SystemProperties; Token: Token; … }
```

Only the config-dependent roots resolve through it: `Conditions`, `Breakpoints`, `ContainerName`, `SystemProperties`
(`types/system`) and `Tokens`, `Token`, each `<Category>Token`, `ColorOpacityModifier`, `ColorOpacityToken`,
`ColorPalette` (`types/tokens`). Each keeps its public name; the generated body moves to a non-exported `Local*`
declaration. Everything else (`SystemStyleObject`, `ConditionalValue`, `Condition`, recipe and pattern types, JSX props)
is derived from these roots and follows without change. Interfaces stay interfaces
(`interface SystemProperties extends Registered<"SystemProperties", LocalSystemProperties> {}`), so user code can still
extend them.

When `designSystem` is set, `types/register` also registers this project's system with that design system:

```ts
import type {} from '@acme/ui/types'
declare module '@acme/ui/types' {
  interface Register {
    system: PandaSystem
  }
}
```

## Decisions

- **Register only the direct design system.** Each `Register` must be filled once (two registrations are TS2717). A
  stacked design system registers with its parent, and the app registers with the stacked one. Because the stacked
  system's `PandaSystem` is itself built from registered types, the base resolves to the app's types through the chain.
- **The target comes from `designSystem`.** The app's config names its direct design system and wins over design-system
  presets, so `${designSystem}/types` (the `./types` export `panda lib` writes) is always the right module. No extra
  codegen input.
- **The registration loads through imports.** `types/system` and `types/tokens` import `./register`, so the augmentation
  applies wherever the app's types are used, regardless of `tsconfig` `include`. The empty `import type {}` loads the
  design system's types, so a stacked system's own registration applies even when the app imports nothing else from it;
  `declare module` alone doesn't load the target.
- **Unregistered means local.** A design system's own build, and any consumer that doesn't register, see its local
  types.

## Limits

- One registering app per TypeScript program. A root `tsconfig` that includes two apps that consume the same design
  system fails with TS2717, as with TanStack Router.
- The app must extend the design system. If it removes or renames tokens the design system uses, design-system component
  props follow the app's narrower types.
- Projects that share types without `designSystem` (for example, importing another config as a preset) don't register.

## Tests

`packages/compiler/__tests__/design-system-types.test.ts` writes real styled-systems for a base design system, a stacked
one and an app into a temporary `node_modules` layout and type-checks with the TypeScript API: app styles in
design-system types (#4029), the chain, and an unregistered design system.
