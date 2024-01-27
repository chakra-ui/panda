---
'@pandacss/token-dictionary': patch
'@pandacss/generator': patch
'@pandacss/fixture': patch
'@pandacss/shared': patch
'@pandacss/studio': patch
'@pandacss/types': patch
'@pandacss/core': patch
'@pandacss/node': patch
---

Introduce 3 new hooks:

```ts
export interface PandaHooks {
  // ..

  /**
   * Called when the TokenDictionary has been created
   * You can use this hook to add your own tokens to the TokenDictionary
   * You can also override the default `formatTokenName` and `formatCssVar` methods
   */
  'tokens:created': (args: { tokens: TokenDictionary }) => MaybeAsyncReturn
  /**
   * Called when the Utility has been created
   * You can override the default `toHash` function used when `config.hash` is set to `true`
   */
  'utility:created': (args: {
    setToHashFn: (fn: (path: string[], toHash: (str: string) => string) => string) => void
  }) => MaybeAsyncReturn
  /**
   * Called right before writing the codegen files to disk.
   * You can use this hook to tweak the codegen files before they are written to disk.
   */
  'codegen:prepare': (args: { artifacts: Artifact[]; changed: ArtifactId[] | undefined }) => MaybeAsyncReturn

  // ..
}
```
