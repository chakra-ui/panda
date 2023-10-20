---
'@pandacss/generator': minor
---

Added a new type to extract variants out of styled components

```tsx
import { VariantStyledProps } from '../styled-system/types/jsx'

const Button = styled('button', {
  base: { color: 'black' },
  variants: {
    state: {
      error: { color: 'red' },
      success: { color: 'green' },
    },
  },
});

type ButtonVariantProps = VariantStyledProps<typeof Button>;
//   ^ { state?: 'error' | 'success' | undefined }
```