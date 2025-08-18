---
title: Panda Integration Hooks
description: Leveraging hooks in Panda to create custom functionality.
---

# Panda Integration Hooks

Panda hooks can be used to add new functionality or modify existing behavior during certian parts of the compiler lifecycle.

Hooks are mostly callbacks that can be added to the panda config via the `hooks` property, or installed via plugins.

Here are some examples of what you can do with hooks:

- modify the resolved config (`config:resolved`), like strip out tokens or keyframes.
- modify presets after they are resolved (`preset:resolved`), like removing specific tokens or theme properties from a preset.
- tweak the design token or classname engine (`tokens:created`, `utility:created`), like prefixing token names, or customizing the hashing function
- transform a source file to a `tsx` friendly syntax before it's parsed (`parser:before`) so that Panda can automatically extract its styles usage
- create your own styles parser (`parser:before`, `parser:after`) using the file's content so that Panda could be used with any templating language
- alter the generated JS and DTS code (`codegen:prepare`)
- modify the generated CSS (`cssgen:done`), allowing all kinds of customizations like removing the unused CSS variables, etc.
- restrict `strictTokens` to a specific set of token categories, ex: only affect `colors` and `spacing` tokens and therefore allow any value for `fontSizes` and `lineHeights`

## Examples

### Prefixing token names

This is especially useful when migrating from other css-in-js libraries, [like Stitches.](/docs/migration/stitches)

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  hooks: {
    'tokens:created': ({ configure }) => {
      configure({
        formatTokenName: path => '$' + path.join('-')
      })
    }
  }
})
```

### Customizing the hash function

When using the [`hash: true`](/docs/concepts/writing-styles) config property, you can customize the function used to hash the classnames.

```ts
export default defineConfig({
  // ...
  hash: true,
  hooks: {
    'utility:created': ({ configure }) => {
      configure({
        toHash: (paths, toHash) => {
          const stringConds = paths.join(':')
          const splitConds = stringConds.split('_')
          const hashConds = splitConds.map(toHash)
          return hashConds.join('_')
        }
      })
    }
  }
})
```

### Modifying the config

Here's an example of how to leveraging the provided `utils` functions in the `config:resolved` hook to remove the `stack` pattern from the resolved config.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  hooks: {
    'config:resolved': ({ config, utils }) => {
      return utils.omit(config, ['patterns.stack'])
    }
  }
})
```

### Modifying presets

You can use the `preset:resolved` hook to modify presets after they are resolved. This is useful for customizing or filtering out parts of a preset.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  hooks: {
    'preset:resolved': ({ utils, preset, name }) => {
      if (name === '@pandacss/preset-panda') {
        return utils.omit(preset, [
          'theme.tokens.colors',
          'theme.semanticTokens.colors'
        ])
      }
      return preset
    }
  }
})
```

### Configuring JSX extraction

Use the `matchTag` / `matchTagProp` functions to customize the way Panda extracts your JSX.

This can be especially useful when working with libraries that have properties that look like CSS properties but are not and should be ignored.

Let's see a Radix UI example where the `Select.Content` component has a `position` property that should be ignored:

```js
// Here, the `position` property will be extracted because `position` is a valid CSS property, but we don't want that
<Select.Content position="popper" sideOffset={5}>
```

```ts
export default defineConfig({
  // ...
  hooks: {
    'parser:before': ({ configure }) => {
      configure({
        // ignore the Select.Content entirely
        matchTag: tag => tag !== 'Select.Content',
        // ...or specifically ignore the `position` property
        matchTagProp: (tag, prop) =>
          tag === 'Select.Content' && prop !== 'position'
      })
    }
  }
})
```

### Remove unused variables from final css

Here's an example of how to transform the generated css in the `cssgen:done` hook.

```ts file="panda.config.ts"
import { defineConfig } from '@pandacss/dev'
import { removeUnusedCssVars } from './remove-unused-css-vars'
import { removeUnusedKeyframes } from './remove-unused-keyframes'

export default defineConfig({
  // ...
  hooks: {
    'cssgen:done': ({ artifact, content }) => {
      if (artifact === 'styles.css') {
        return removeUnusedCssVars(removeUnusedKeyframes(content))
      }
    }
  }
})
```

Get the snippets for the removal logic from our Github Sandbox in the [remove-unused-css-vars](https://github.com/chakra-ui/panda/blob/main/sandbox/vite-ts/remove-unused-css-vars.ts) and [remove-unused-keyframes](https://github.com/chakra-ui/panda/blob/main/sandbox/vite-ts/remove-unused-keyframes.ts) files.

> Note: Using this means you can't use the JS function [`token.var`](/docs/guides/dynamic-styling#using-tokenvar) (or [token(xxx)](/docs/guides/dynamic-styling#using-token) where `xxx` is the path to a [semanticToken](/docs/theming/tokens#semantic-tokens)) from `styled-system/tokens` as the CSS variables will be removed based on the usage found in the generated CSS

## Sharing hooks

Hooks can be shared as a snippet or as a `plugin`. Plugins are currently simple objects that contain a `name` associated with a `hooks` object with the same structure as the `hooks` object in the config.

> Plugins differ from `presets` as they can't be extended, but they will be called in sequence in the order they are defined in the `plugins` array, with the user's config called last.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  plugins: [
    {
      name: 'token-format',
      hooks: {
        'tokens:created': ({ configure }) => {
          configure({
            formatTokenName: path => '$' + path.join('-')
          })
        }
      }
    }
  ]
})
```

## Reference

```ts
export interface PandaHooks {
  /**
   * Called when the config is resolved, after all the presets are loaded and merged.
   * This is the first hook called, you can use it to tweak the config before the context is created.
   */
  'config:resolved': (
    args: ConfigResolvedHookArgs
  ) => MaybeAsyncReturn<void | ConfigResolvedHookArgs['config']>
  /**
   * Called when a preset is resolved, allowing you to modify it before it's merged into the config.
   */
  'preset:resolved': (
    args: PresetResolvedHookArgs
  ) => MaybeAsyncReturn<void | PresetResolvedHookArgs['preset']>
  /**
   * Called when the token engine has been created
   */
  'tokens:created': (args: TokenCreatedHookArgs) => MaybeAsyncReturn
  /**
   * Called when the classname engine has been created
   */
  'utility:created': (args: UtilityCreatedHookArgs) => MaybeAsyncReturn
  /**
   * Called when the Panda context has been created and the API is ready to be used.
   */
  'context:created': (args: ContextCreatedHookArgs) => void
  /**
   * Called when the config file or one of its dependencies (imports) has changed.
   */
  'config:change': (args: ConfigChangeHookArgs) => MaybeAsyncReturn
  /**
   * Called after reading the file content but before parsing it.
   * You can use this hook to transform the file content to a tsx-friendly syntax so that Panda's parser can parse it.
   * You can also use this hook to parse the file's content on your side using a custom parser, in this case you don't have to return anything.
   */
  'parser:before': (args: ParserResultBeforeHookArgs) => string | void
  /**
   * Called after the file styles are extracted and processed into the resulting ParserResult object.
   * You can also use this hook to add your own extraction results from your custom parser to the ParserResult object.
   */
  'parser:after': (args: ParserResultAfterHookArgs) => void
  /**
   * Called right before writing the codegen files to disk.
   * You can use this hook to tweak the codegen files before they are written to disk.
   */
  'codegen:prepare': (
    args: CodegenPrepareHookArgs
  ) => MaybeAsyncReturn<Artifact[]>
  /**
   * Called after the codegen is completed
   */
  'codegen:done': (args: CodegenDoneHookArgs) => MaybeAsyncReturn
  /**
   * Called right before adding the design-system CSS (global, static, preflight, tokens, keyframes) to the final CSS
   * Called right before writing/injecting the final CSS (styles.css) that contains the design-system CSS and the parser CSS
   * You can use it to tweak the CSS content before it's written to disk or injected through the postcss plugin.
   */
  'cssgen:done': (args: CssgenDoneHookArgs) => string | void
}
```
