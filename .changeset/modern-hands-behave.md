---
'@pandacss/core': patch
---

Fix issue where Panda eagerly tracks every JSX slot of a slot recipe when scanning for recipe props.

For example, assume you have a tabs recipe with the following slots:

```jsx
<Tabs.Root>
  <Tabs.List>
    <Tabs.Trigger />
  </Tabs.List>
  <Tabs.Content />
</Tabs.Root>
```

Panda tracks recipe props in `Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, and `Tabs.Content`. This can lead to slightly
more works in the compiler.

This PR fixes this by only tracking recipe props in the `Tabs.Root` slot.
