---
'@pandacss/generator': minor
---

Added a new type to extract variants out of styled components

```tsx
import { StyledVariantProps } from '../styled-system/jsx'

const Button = styled('button', {
  base: { color: 'black' },
  variants: {
    state: {
      error: { color: 'red' },
      success: { color: 'green' },
    },
  },
});

type ButtonVariantProps = StyledVariantProps<typeof Button>;
//   ^ { state?: 'error' | 'success' | undefined }
```