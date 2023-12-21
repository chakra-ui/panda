---
'@pandacss/dev': minor
---

Add support for emit-pkg command to emit just the `package.json` file with the required entrypoints. If an existing
`package.json` file is present, the `exports` field will be updated.

When setting up Panda in a monorepo, this command is useful in monorepo setups where you want the codegen to run only in
a dedicated workspace package.
