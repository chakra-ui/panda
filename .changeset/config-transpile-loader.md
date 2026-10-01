---
'@pandacss/config': patch
---

Loading a TypeScript `panda.config.ts` is faster. Panda transpiles the config and its local imports file by file and
imports packages with Node, so most configs no longer load Rolldown's bundler. Configs that rely on tsconfig `paths`,
CommonJS, or Node before 22.15 still use the bundler.
