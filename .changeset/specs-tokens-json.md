---
'@pandacss/compiler': minor
---

Generate design-system specs again as JSON. `panda codegen` writes `styled-system/specs/tokens.json` (raw tokens grouped by category, `{ data: [{ type, values: [{ name, value }] }] }`) and `styled-system/specs/semantic-tokens.json` (semantic tokens with their per-condition values). Import them to build your own token viewer, feed docs, or hand your design system to an LLM.
