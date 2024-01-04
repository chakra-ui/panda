---
title: Frequently Asked Questions
description: Frequently asked questions and how to resolve common issues
layout: none
---

# Frequently Asked Questions

Here's a list of frequently asked questions (FAQ) and how to resolve common issues in Panda.

### Why do I get a "Cannot find X module from 'styled-system'" error?

This error seems to be caused by process timing issues between file writes. This has been fixed recently but if you experience this persistently, consider the following workarounds:

- Check the code to git: Remove the `styled-system` folder from the `.gitignore` file to enable git tracking. Technically, the files emitted will remain the same if the Panda config does not change.

- Use the `emitPackage: true` option and write the files to the `node_modules` directory.

---

### Why are my styles not applied?

Check that the [`@layer` rules](/docs/concepts/cascade-layers#layer-css) are set and the corresponding `.css` file is included. [If you're not using `postcss`](/docs/installation/cli), ensure that `styled-system/styles.css` is imported and that the `panda` command has been run (or is running with `--watch`).

---

### How can I debug the styles?

You can use the `panda debug` to debug design token extraction & css generated from files.

If the issue persists, you can try looking for it in the [issues](https://github.com/chakra-ui/panda/issues) or in the [discord](https://discord.gg/VQrkpsgSx7). If you can't find it, please create a minimal reproduction and submit [a new github issue](https://github.com/chakra-ui/panda/issues/new/choose) so we can help you.

---

### Why is my IDE not showing `styled-system` imports?

If you're not getting import autocomplete in your IDE, you may need to include the `styled-system` directory in your tsconfig.json file.

---

### How do I get a type with each recipe properties?

You can get a [`config recipe`](/docs/concepts/recipes#config-recipe) properties types by using `XXXVariantProps`. Let's say you have a `config recipe` named `button`, you can import its type like this:

```ts
import { button, type ButtonVariantProps } from '../styled-system/recipes'
```

---

You can get an [`atomic recipe`](/docs/concepts/recipes#atomic-recipe) properties types by using `RecipeVariantProps`. Let's say you have a `atomic recipe` named `button`, you can get its type like this:

```ts
import { cva, type RecipeVariantProps } from '../styled-system/css'

export type ButtonVariantProps = RecipeVariantProps<typeof buttonStyle>
```

---

### How do I split recipe props from the rest?

You can split recipe props by using `xxx.splitVariantProps`. Let's say you have a `recipe` named `button`, you can split its props like this:

```tsx Button.tsx {8}
import { css, cx } from '../styled-system/css'
import { ButtonVariantProps, button } from '../styled-system/recipes'

interface ButtonProps extends ButtonVariantProps {
  children: React.ReactNode
}

export function Button(props: ButtonProps) {
  const { children, ...rest } = props
  const [buttonProps, cssProps] = button.splitVariantProps(rest)
  return (
    <button className={cx(button(buttonProps), css(cssProps))}>
      {children}
    </button>
  )
}
```

The same `xxx.splitVariantProps` method is available for both `config recipes` and `atomic recipes`.

---

### How do I reference a token value or css var?

You can reference a token value or it's associated css variable using the [`token` function](/docs/theming/usage#vanilla-js). This function allows you to access and use the values stored in your theme tokens at runtime.

```tsx
import { token } from '../styled-system/tokens'

function App() {
  return (
    <div
      style={{
        background: token('colors.blue.200')
      }}
    />
  )
}
```

---

### Should I commit the styled-system folder?

Just like the `node_modules` folder, you most likely don't want to commit the `styled-system` folder. It contains code that is auto-generated and can be re-generated at any time.

---

### How does Panda work?

When running `pnpm panda`, here's what's happening under the hood:

- **Load Panda context**:
  - Find and evaluate app config, merge result with presets.
  - Create panda context: prepare code generator from config, parse user's file as AST.
- **Generating artifacts**:
  - Write lightweight JS runtime and types to output directory
- **Extracting used styles in app code**:
  - Run parser on each user's file: identify and extract styles, compute CSS, write to styles.css.

---

### I'm seeing a "Could not resolve xxx" error with esbuild/tsup. What should I do?

In such a case, check the [`outExtension`](/docs/references/config#outextension) in your `panda.config` and set it to "js". This will ensure your modules are resolved correctly.

---

### How should I use emitPackage with yarn PnP?

When using `emitPackage: true` with yarn PnP, set the `nodeLinker` to 'node-modules' in your `.yarnrc.yml`. This tells Yarn to use the traditional way of linking dependencies, which can solve compatibility issues.

---

### Why does importing `styled` not exist?

You should use [`config.jsxFramework`](/docs/concepts/style-props#configure-jsx) when you need to import styled components. You can then use the [`jsxFactory`](/references/config#jsxfactory) option to set the name of the factory component.

---

### Why is my preset overriding the base one, even after adding it to the array?

You might have forgotten to include the `extend` keyword in your config. Without `extend`, your preset will completely replace the base one, instead of merging with it.

---

### Why is my base condition not working in this example?

```ts
css({ color: { _base: 'red.600', _dark: 'white' } })
```

You used `_base` instead of `base`, there is no underscore `_`.

---

### What's the difference between using `defineConfig()` vs `definePreset()`

`defineConfig` is intended to be used in your app config, and will show you all the config keys that are available.
`definePreset` will only show you the config keys that will be merged into an app's config, the rest will be ignored.

---

### How can I completely override the default tokens?.

If you want to **completely override all** of the default presets theme tokens, you can omit the `extends` keyword from your `theme` config object.

If you want to **keep some of the defaults**, you can install the `@pandacss/preset-panda` package, import it, then specifically pick what you need in there (or use the JS spread operator `...` and override the other keys).

---

### How do I make a design system / component library with Panda?

There is a detailed guide on how to do this [here](/docs/guides/component-library).

---

### Can I use dynamic styles with Panda?

Yes, you can use dynamic styles with Panda. More on that [here](/docs/guides/dynamic-styling#runtime-conditions).

---

### Should I use atomic or config recipes ?

[Config recipes](/docs/concepts/recipes#config-recipe) are generated just in time, meaning that only the recipes and variants you use will exist in the generated CSS, regardless of the number of recipes in the config.

This contrasts with [Atomic recipes](/docs/concepts/recipes#atomic-recipe) (cva), which generates all of the variants regardless of what was used in your code. The reason for this difference is that all `config.recipes` are known at the start of the panda process when we evaluate your config. In contrast, the CVA recipes are scattered throughout your code. To get all of them and find their usage across your code, we would need to scan your app code multiple times, which would not be ideal performance-wise.

When dealing with simple use cases, or if you need code colocation, or even avoiding dynamic styling, atomic recipes shine by providing all style variants. Config recipes are preferred for design system components, delivering leaner CSS with only the styles used. Choose according to your component needs.

---

### Why does the panda codegen command fail ?

If you run into any error related to "Transforming const to the configured target environment ("es5") is not supported yet", update your tsconfig to use es6 or higher:

```json filename="tsconfig.json"
{
  "compilerOptions": {
    "target": "es6"
  }
}
```

---

### Can I set an alpha / add an opacity modifier on a color?

Currently, setting an alpha on a color like `css({ color: "blue.200/40" })` is not possible. We are planning to implement this feature using the `color-mix` function.

However, note that `color-mix` is a CSS native function and is not yet supported in all browsers. You can follow the discussion about this topic on this [GitHub link](https://github.com/chakra-ui/panda/discussions/862).

---

### How can I generate all possible CSS variants at build time?

While it's possible to generate all variants, even unused ones, by using [`config.staticCss`](https://panda-css.com/docs/guides/dynamic-styling#using-static-css), it's generally **not recommended** to use it for more than a few values. However, keep in mind this approach compromises one of Panda's strengths: lean, usage-based CSS generation.

---

### Can I use one-off media query and other at rules?

Yes, you can! You can apply one-off media queries and other at rules (such as `@container`, `@supports`) in your CSS as shown below:

```javascript
css({
  containerType: 'size',
  '@media (min-width: 10px)': {
    fontSize: 'xl',
    color: 'blue.300'
  },
  '@container (min-width: 10px)': {
    fontSize: '2xl',
    color: 'green.300'
  },
  '@supports (display: flex)': {
    fontSize: '3xl',
    color: 'red.300'
  }
})
```

---

### How can I prevent other libraries from overriding my styles?

You can use [Layer Imports](<https://developer.mozilla.org/en-US/docs/Web/CSS/@import#layer-name:~:text=%40import%20url%20layer(layer%2Dname)%3B>) to prevent other libraries from overriding your styles.

First of all you cast the css from the other library(s) to a css layer:

```css
@import url('bootstrap.css') layer(bootstrap);

@import url('ionic.css') layer(ionic);
```

Then update the default layer list to deprioritize the styles from the other library(s):

```css
@layer bootstrap, reset, base, token, recipes, utilities;

@layer ionic, reset, base, token, recipes, utilities;
```
