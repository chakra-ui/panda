---
'@pandacss/config': patch
---

Loading a TypeScript `panda.config.ts` is faster. Panda transpiles the config and its local imports file by file and
imports packages with Node, so most configs no longer load Rolldown's bundler. Configs that rely on tsconfig `paths`,
CommonJS packages, or Node before 22.15 still use the bundler. Run with `NODE_DEBUG=panda` to see why.

An error thrown by your config is now reported right away, without running the config again.
