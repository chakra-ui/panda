---
'@pandacss/parser': patch
---

Normalize tsconfig `compilerOptions` before passing them to ts-morph.

TypeScript 6.0 (bundled inside `ts-morph@28` via `@ts-morph/common@0.29`) now refuses to accept
raw JSON `compilerOptions` with string-form enum values like `target: "ESNext"`. They must be
converted to numeric enum values via the TypeScript parser API.

Previously, panda forwarded the parsed-as-JSON `compilerOptions` from `get-tsconfig` straight
to ts-morph, which caused `panda` (codegen and any command that loads source files) to throw:

```
target is a string value; tsconfig JSON must be parsed with parseJsonSourceFileConfigFileContent
or getParsedCommandLineOfConfigFile before passing to createProgram
```

We now run `compilerOptions` through `ts.convertCompilerOptionsFromJson` so string enums are
normalized before ts-morph instantiates its TypeScript program.
