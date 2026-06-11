---
title: Container Query Theme API
status: accepted
scope:
  - packages/config
  - packages/compiler-shared
  - crates/pandacss_config
  - crates/pandacss_project
  - crates/pandacss_codegen
---

# Container Query Theme API

## Summary

Container query sizes should be a shared theme scale, and container names should only scope which ancestor is queried.
Panda v2 uses `theme.containers` for the shared size scale, keeps `theme.containerNames` for named scopes, and avoids a
new `cq` pattern. Users declare containers with native CSS properties: `container`, `containerName`, and
`containerType`.

This decision is scoped to the v2 Rust/compiler path. Existing legacy TypeScript packages may remain as compatibility
or reference code; this note should not be read as a requirement to retrofit `packages/core`, `packages/generator`,
`packages/types`, or the existing legacy pattern package.

The API is intentionally close to legacy `containerNames` + `containerSizes`; the main v2 change is renaming
`containerSizes` to `containers`, adding range expansion, and dropping the `cq` pattern as the preferred declaration
API.

```ts
export default defineConfig({
  theme: {
    containers: {
      sm: '24rem',
      md: '36rem',
      lg: '48rem',
    },
    containerNames: ['card', 'sidebar'],
  },
})
```

Generated conditions use the shared scale for unnamed and named containers:

```ts
css({
  container: 'card / inline-size',
  gap: {
    '@/sm': '2',
    '@card/md': '4',
    '@sidebar/lg': '6',
  },
})
```

## Decision

CSS container queries have two separate jobs:

- declare a container with `container`, `container-name`, and `container-type`,
- query an ancestor container with `@container`, optionally scoped by container name.

Panda should keep those jobs separate. `theme.containers` only defines reusable query thresholds:

```ts
theme: {
  containers: {
    sm: '24rem',
    md: '36rem',
  },
}
```

It generates unnamed conditions:

```ts
'@/sm'     // @container (inline-size >= 24rem)
'@/smDown'
'@/smOnly'
'@/smToMd'
```

`theme.containerNames` reuses that scale for named scopes:

```ts
theme: {
  containerNames: ['card', 'sidebar'],
  containers: {
    sm: '24rem',
    md: '36rem',
  },
}
```

It generates named conditions:

```ts
'@card/sm'     // @container card (inline-size >= 24rem)
'@card/smDown'
'@card/smOnly'
'@card/smToMd'
'@sidebar/sm'  // @container sidebar (inline-size >= 24rem)
```

Range expansion mirrors breakpoints: the plain key is the "up" condition, and `Down`, `Only`, and `To` keys come from
the ordered scale.

## Non-Goals

Do not add object query values such as `{ max: '20rem' }` or nested per-name scales to `theme.containers`. The shared
scale keeps the common design-system case compact and matches how container names work in CSS: names select a target;
they do not define a sizing system.

Do not encode arbitrary container query conditions in `theme.containers`. Advanced queries should use `conditions`:

```ts
export default defineConfig({
  conditions: {
    cardCompact: '@container card (inline-size < 20rem)',
    cardLandscape: '@container card (orientation: landscape)',
  },
})
```

## Type Surface

Generated conditions include unnamed and named range keys:

```ts
css({
  fontSize: {
    '@/sm': 'sm',
    '@card/md': 'lg',
    '@card/mdDown': 'md',
  },
})
```

Known container names come from `theme.containerNames` and improve native CSS property types:

```ts
css({
  containerName: 'card',
  container: 'card / inline-size',
  containerType: 'inline-size',
})
```

`containerName` should include known names plus the normal CSS escape hatch. `container` may include known shorthand
combinations such as `${ContainerName} / inline-size`, but must still allow arbitrary valid CSS strings.

## Migration Guide

Rename legacy `containerSizes` to `containers`; keep `containerNames`:

```ts
export default defineConfig({
  theme: {
    containerNames: ['card', 'sidebar'],
    containers: {
      sm: '24rem',
      md: '36rem',
    },
  },
})
```

This preserves unnamed keys like `@/sm` and named keys like `@card/sm`, with added range keys such as `@/smDown`,
`@/smOnly`, and `@card/smToMd`.

Migrate `cq` usage to native CSS properties in `css`, recipes, and patterns:

```ts
css({
  container: 'card / inline-size',
  gap: {
    '@card/sm': '4',
  },
})
```

Or set the longhands directly:

```ts
css({
  containerName: 'card',
  containerType: 'inline-size',
})
```

Compatibility code may accept `containerSizes`, but users should not define both `containerSizes` and `containers` with
conflicting values for the same key.

## V2 Adoption

The v2 path should:

- prefer `theme.containers` in docs and generated types,
- keep `theme.containerNames` as the source of named container scopes,
- generate named conditions by applying `containerNames` to the shared `containers` scale,
- keep native CSS props as the primary declaration API,
- route non-scale query aliases through `conditions`.

## Related

- [Condition API Direction](./condition-api.mdx)
- [Generated Types Design](./generated-types-design.md)
- [MDN: CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries)
- [MDN: `container`](https://developer.mozilla.org/en-US/docs/Web/CSS/container)
- [W3C: CSS Containment Module Level 3](https://www.w3.org/TR/css-contain-3/)
