---
'@pandacss/cli': minor
'@pandacss/generator': minor
'@pandacss/node': minor
'@pandacss/types': minor
---

Add `panda spec` command to generate specification files for your theme (useful for documentation). This command
generates JSON specification files containing metadata, examples, and usage information.

```bash
# Generate all spec files
panda spec

# Generate with filter (filters across all spec types)
panda spec --filter "button*"

# Custom output directory
panda spec --outdir custom/specs

# Include spec entrypoint in package.json
panda emit-pkg --spec
```

Spec files can be consumed via:

```javascript
import tokens from 'styled-system/specs/tokens'
import recipes from 'styled-system/specs/recipes'
```
