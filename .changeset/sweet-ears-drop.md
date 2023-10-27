---
'@pandacss/postcss': patch
'@pandacss/symlink': patch
'@pandacss/dev': patch
---

Fix an issue with the CLI, using the dev mode instead of the prod mode even when installed from npm.

This resolves the following errors:

```
 Error: Cannot find module 'resolve.exports'
```

```
Error: Cannot find module './src/cli-main'
```
