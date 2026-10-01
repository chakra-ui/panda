---
'@pandacss/compiler': patch
---

Fix `styled()` and recipe context components not being assignable to `ComponentType<Props>` when `Props` is an
interface, as in 1.x. `data-*` attributes still work in JSX and `defaultProps`.

```tsx
interface IconProps {
  size?: number
}
const RedIcon: ComponentType<IconProps> = styled(Icon, { base: { color: 'red.500' } })
```
