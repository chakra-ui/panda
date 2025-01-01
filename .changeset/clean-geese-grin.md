---
'@pandacss/reporter': patch
'@pandacss/dev': patch
---

Redesigned the recipe report to be more readable and easier to understand. We simplified the `JSX` and `Function`
columns to be more concise.

**BEFORE**

```sh
╔════════════════════════╤══════════════════════╤═════════╤═══════╤════════════╤═══════════════════╤══════════╗
║ Recipe                 │ Variant Combinations │ Usage % │ JSX % │ Function % │ Most Used         │ Found in ║
╟────────────────────────┼──────────────────────┼─────────┼───────┼────────────┼───────────────────┼──────────╢
║ someRecipe (1 variant) │ 1 / 1                │ 100%    │ 100%  │ 0%         │ size.small        │ 1 file   ║
╟────────────────────────┼──────────────────────┼─────────┼───────┼────────────┼───────────────────┼──────────╢
║ button (4 variants)    │ 7 / 9                │ 77.78%  │ 63%   │ 38%        │ size.md, size.sm, │ 2 files  ║
║                        │                      │         │       │            │ state.focused,    │          ║
║                        │                      │         │       │            │ variant.danger,   │          ║
║                        │                      │         │       │            │ variant.primary   │          ║
╚════════════════════════╧══════════════════════╧═════════╧═══════╧════════════╧═══════════════════╧══════════╝
```

**AFTER**

```sh
╔════════════════════════╤════════════════╤═══════════════════╤═══════════════════╤══════════╤═══════════╗
║ Recipe                 │ Variant values │ Usage %           │ Most used         │ Found in │ Used as   ║
╟────────────────────────┼────────────────┼───────────────────┼───────────────────┼──────────┼───────────╢
║ someRecipe (1 variant) │ 1 value        │ 100% (1 value)    │ size.small        │ 1 file   │ jsx: 100% ║
║                        │                │                   │                   │          │ fn: 0%    ║
╟────────────────────────┼────────────────┼───────────────────┼───────────────────┼──────────┼───────────╢
║ button (4 variants)    │ 9 values       │ 77.78% (7 values) │ size.md, size.sm, │ 2 files  │ jsx: 63%  ║
║                        │                │                   │ state.focused,    │          │ fn: 38%   ║
║                        │                │                   │ variant.danger,   │          │           ║
║                        │                │                   │ variant.primary   │          │           ║
╚════════════════════════╧════════════════╧═══════════════════╧═══════════════════╧══════════╧═══════════╝
```
