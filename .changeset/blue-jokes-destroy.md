---
'@pandacss/generator': minor
'@pandacss/fixture': minor
'@pandacss/config': minor
'@pandacss/parser': minor
'@pandacss/types': minor
'@pandacss/core': minor
'@pandacss/node': minor
'@pandacss/dev': minor
---

Refactor `config.hooks` to be much more powerful, you can now:

- Tweak the config after it has been resolved (after presets are loaded and merged), this could be used to dynamically
  load all `recipes` from a folder
- Transform a source file's content before parsing it, this could be used to transform the file content to a
  `tsx`-friendly syntax so that Panda's parser can parse it.
- Implement your own parser logic and add the extracted results to the classic Panda pipeline, this could be used to
  parse style usage from any template language
- Tweak the CSS content for any `@layer` or even right before it's written to disk (if using the CLI) or injected
  through the postcss plugin, allowing all kinds of customizations like removing the unused CSS variables, etc.
- React to any config change or after the codegen step (your outdir, the `styled-system` folder) have been generated

See the list of available `config.hooks` here:

```ts
export interface PandaHooks {
  /**
   * Called when the config is resolved, after all the presets are loaded and merged.
   * This is the first hook called, you can use it to tweak the config before the context is created.
   */
  'config:resolved': (args: { conf: LoadConfigResult }) => MaybeAsyncReturn
  /**
   * Called when the Panda context has been created and the API is ready to be used.
   */
  'context:created': (args: { ctx: ApiInterface; logger: LoggerInterface }) => void
  /**
   * Called when the config file or one of its dependencies (imports) has changed.
   */
  'config:change': (args: { config: UserConfig }) => MaybeAsyncReturn
  /**
   * Called after reading the file content but before parsing it.
   * You can use this hook to transform the file content to a tsx-friendly syntax so that Panda's parser can parse it.
   * You can also use this hook to parse the file's content on your side using a custom parser, in this case you don't have to return anything.
   */
  'parser:before': (args: { filePath: string; content: string }) => string | void
  /**
   * Called after the file styles are extracted and processed into the resulting ParserResult object.
   * You can also use this hook to add your own extraction results from your custom parser to the ParserResult object.
   */
  'parser:after': (args: { filePath: string; result: ParserResultInterface | undefined }) => void
  /**
   * Called after the codegen is completed
   */
  'codegen:done': () => MaybeAsyncReturn
  /**
   * Called right before adding the design-system CSS (global, static, preflight, tokens, keyframes) to the final CSS
   * Called right before writing/injecting the final CSS (styles.css) that contains the design-system CSS and the parser CSS
   * You can use it to tweak the CSS content before it's written to disk or injected through the postcss plugin.
   */
  'cssgen:done': (args: {
    artifact: 'global' | 'static' | 'reset' | 'tokens' | 'keyframes' | 'styles.css'
    content: string
  }) => string | void
}
```
