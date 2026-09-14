---
'@pandacss/compiler': minor
'@pandacss/compiler-shared': minor
'@pandacss/compiler-wasm': minor
---

Replace `specs/tokens.json` and `specs/semantic-tokens.json` with one `specs/design-system.json` covering every token,
condition and theme. It records what each token resolves through, so tools can answer what a semantic token points at
and what breaks when a primitive changes. Read it with `parseDesignSystem` and query it with `indexDesignSystem` from
`@pandacss/compiler-shared`.
