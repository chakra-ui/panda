---
'@pandacss/eslint-plugin': minor
---

Add Panda Eslint Plugin.

Install the package:

```bash
pnpm add -D @pandacss/eslint-plugin
```

Add it to your `.eslintrc.json` file, then configure the rules you want to use under the rules section:

```json
{
  "plugins": ["@pandacss"],
  "rules": {
    "@pandacss/no-shorthand-prop": "warn"
  }
}
```
