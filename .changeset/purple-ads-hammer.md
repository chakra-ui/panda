---
'@pandacss/extractor': patch
---

Resolve identifier default value from parameter, code like `position` and `inset` here:

```tsx
export const Positioned: React.FC<PositionedProps> = ({ children, position = 'absolute', inset = 0, ...rest }) => (
  <styled.div position={position} inset={inset} {...rest}>
    {children}
  </styled.div>
)
```
