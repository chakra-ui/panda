---
'@pandacss/core': patch
---

Fix an edge-case when Panda eagerly extracted and tried to generate the CSS for a JSX property that contains an URL.

```tsx
const App = () => {
  // here the content property is a valid CSS property, so Panda will try to generate the CSS for it
  // but since it's an URL, it would produce invalid CSS
  // we now check if the property value is an URL and skip it if needed
  return <CopyButton content="https://www.buymeacoffee.com/grizzlycodes" />
}
```
