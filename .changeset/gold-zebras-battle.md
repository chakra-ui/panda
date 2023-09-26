---
'@pandacss/generator': patch
---

When bundling the `outdir` in a library, you usually want to generate type declaration files (`d.ts`). Sometimes TS will
complain about types not being exported.

- Export all types from `{outdir}/types/index.d.ts`, this fixes errors looking like this:

```
src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/system-types'. This is likely not portable. A type annotation is necessary.
src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/csstype'. This is likely not portable. A type annotation is necessary.
src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/conditions'. This is likely not portable. A type annotation is necessary.
```

- Export generated recipe interfaces from `{outdir}/recipes/{recipeFn}.d.ts`, this fixes errors looking like this:

```
src/ui/avatar.tsx (16:318) "AvatarRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/avatar.tsx".
src/ui/card.tsx (2:164) "CardRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/card.tsx".
src/ui/checkbox.tsx (19:310) "CheckboxRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/checkbox.tsx".
```

- Export type `ComponentProps` from `{outdir}/types/jsx.d.ts`, this fixes errors looking like this:

```
 "ComponentProps" is not exported by "styled-system/types/jsx.d.ts", imported by "src/ui/form-control.tsx".
```
