---
'@pandacss/dev': patch
---

Re-export the `AnimationStyles` type from `@pandacss/dev` so the return type of `defineAnimationStyles` can be resolved by consumers. Previously only `TextStyles` and `LayerStyles` were re-exported, which caused the generated `.d.ts` to fall back to a deep qualified name (`_pandacss_types.AnimationStyles`) for `defineAnimationStyles`'s inferred return type. When consumers could not resolve that path, the value was inferred as `any` and triggered `@typescript-eslint/no-unsafe-assignment` at call sites.
