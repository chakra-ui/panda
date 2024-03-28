---
'@pandacss/parser': patch
---

Fix JSX matching with recipes after introducing namespace imports

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  theme: {
    extend: {
      slotRecipes: {
        tabs: {
          className: 'tabs',
          slots: ['root', 'list', 'trigger', 'content', 'indicator'],
          base: {
            root: {
              display: 'flex',
              // ...
            },
          },
        },
      },
    },
  },
})
```

```tsx
const App = () => {
  return (
    // ❌ this was not matched to the `tabs` slot recipe
    // ✅ fixed with this PR
    <Tabs.Root defaultValue="button">
      <Tabs.List>
        <Tabs.Trigger value="button">Button</Tabs.Trigger>
        <Tabs.Trigger value="radio">Radio Group</Tabs.Trigger>
        <Tabs.Trigger value="slider">Slider</Tabs.Trigger>
        <Tabs.Indicator />
      </Tabs.List>
    </Tabs.Root>
  )
}
```

We introduced a bug in [v0.34.2](https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md#0342---2024-03-08) where the
`Tabs.Trigger` component was not being matched to the `tabs` slot recipe, due to the
[new namespace import feature](https://github.com/chakra-ui/panda/pull/2371).
