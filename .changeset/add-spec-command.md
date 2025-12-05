---
'@pandacss/dev': minor
'@pandacss/generator': minor
'@pandacss/node': minor
'@pandacss/types': minor
---

Add `panda spec` command to generate specification files for your theme (useful for documentation). This command
generates JSON specification files containing metadata, examples, and usage information.

```bash
# Generate all spec files
panda spec

# Custom output directory
panda spec --outdir custom/specs
```

**Token Spec Structure:**

```json
{
  "type": "tokens",
  "data": [
    {
      "type": "aspectRatios",
      "values": [{ "name": "square", "value": "1 / 1", "cssVar": "var(--aspect-ratios-square)" }],
      "tokenFunctionExamples": ["token('aspectRatios.square')"],
      "functionExamples": ["css({ aspectRatio: 'square' })"],
      "jsxExamples": ["<Box aspectRatio=\"square\" />"]
    }
  ]
}
```

**Spec Usage:**

```javascript
import tokens from 'styled-system/specs/tokens'
import recipes from 'styled-system/specs/recipes'
```
