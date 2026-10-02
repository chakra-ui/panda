---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

`forwardProps` now types a forwarded prop from the wrapped component when it shares a name with a style prop, so a
component's own `position` or `translate` prop no longer conflicts with the CSS one:

```tsx
const Handle = withContext(ImageCropper.Handle, 'handle', { forwardProps: ['position'] })

<Handle position="ne" /> // typed as the component's `position`, not CSS `position`
```
