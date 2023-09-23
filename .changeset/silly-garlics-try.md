---
'@pandacss/generator': patch
'@pandacss/studio': patch
---

Improved styled factory by adding a 3rd (optional) argument:

```ts
interface FactoryOptions<TProps extends Dict> {
  dataAttr?: boolean
  defaultProps?: TProps
  shouldForwardProp?(prop: string, isCssProperty: (prop: string) => boolean): boolean
}
```

- Setting `dataAttr` to true will add a `data-recipe="{recipeName}"` attribute to the element with the recipe name. This
  is useful for testing and debugging.

- `defaultProps` allows you to skip writing wrapper components just to set a few props. It also allows you to locally
  override the default variants of a recipe.

- `shouldForwardProp` allows you to customize which props are forwarded to the underlying element. By default, all props
  except recipe variants and style props are forwarded.
