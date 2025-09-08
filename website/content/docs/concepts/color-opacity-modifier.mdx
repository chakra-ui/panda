---
title: Color opacity modifier
description: How to dynamically set the opacity of a raw color or color token
---

# Color opacity modifier

Every utilities connected to the `colors` tokens in the `@pandacss/preset-base` (included by default) can use the
[`color-mix`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) CSS function. This means for example: `background`, `backgroundColor`, `color`, `border`, `borderColor`, etc.

This function allows you to mix two colors together, and we use it to change the opacity of a color using the
`{color}/{opacity}` syntax.

You can use it like this:

```ts
css({
  bg: 'red.300/40',
  color: 'white'
})
```

This will generate:

```css
@layer utilities {
  .bg_red\.300\/40 {
    --mix-background: color-mix(
      in srgb,
      var(--colors-red-300) 40%,
      transparent
    );
    background: var(--mix-background, var(--colors-red-300));
  }

  .text_white {
    color: var(--colors-white);
  }
}
```

- If you're not using any opacity, the utility will **not** use `color-mix`
- The utility will automatically fallback to the original color if the `color-mix` function is not supported by the
  browser.
- You can use any of the color tokens, and any of the opacity tokens.

---

The `utilities` transform function also receives a `utils` object that contains the `colorMix` function, so you can
also use it on your own utilities:

```ts
export default defineConfig({
  utilities: {
    background: {
      shorthand: 'bg',
      className: 'bg',
      values: 'colors',
      transform(value, args) {
        const mix = args.utils.colorMix(value)
        // This can happen if the value format is invalid (e.g. `bg: red.300/invalid` or `bg: red.300//10`)
        if (mix.invalid) return { background: value }

        return {
          background: mix.value
        }
      }
    }
  }
})
```

---

Here's a cool snippet (that we use internally !) that makes it easier to create a utility transform for a given
property:

```ts
import type { PropertyTransform } from '@pandacss/types'
export const createColorMixTransform =
  (prop: string): PropertyTransform =>
  (value, args) => {
    const mix = args.utils.colorMix(value)
    if (mix.invalid) return { [prop]: value }
    const cssVar = '--mix-' + prop
    return {
      [cssVar]: mix.value,
      [prop]: `var(${cssVar}, ${mix.color})`
    }
  }
```

then the same utility transform as above can be written like this:

```ts
export default defineConfig({
  utilities: {
    background: {
      shorthand: "bg",
      className: "bg",
      values: "colors",
      transform: createColorMixTransform("background"),
  },
});
```
