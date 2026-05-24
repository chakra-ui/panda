---
'@pandacss/generator': patch
---

Fix `forwardProps` being ignored by `withProvider` in `createStyleContext`.

Previously, `withProvider` split out variant props before handing them to the wrapped component, so any variant prop
listed in `forwardProps` never reached the component (it was silently dropped). Now variant props named in
`forwardProps` still drive the slot styles **and** are forwarded to the component.

```tsx
const { withProvider } = createStyleContext(tabs)

function TabsRoot({ orientation, ...rest }) {
  // `orientation` is now defined here instead of `undefined`
  return <div aria-orientation={orientation} {...rest} />
}

export const Tabs = withProvider(TabsRoot, 'root', { forwardProps: ['orientation'] })
```

This is fixed across the React, Preact, Vue, and Solid outputs. The Solid implementation forwards the props through
getters so reactivity is preserved.
