---
'@pandacss/generator': patch
---

Fix vue `styled` factory internal class merging, for example:

```vue
<script setup>
import { styled } from '../styled-system/jsx'

const StyledButton = styled('button', {
  base: {
    bgColor: 'red.300',
  },
})
</script>
<template>
  <StyledButton id="test" class="test">
    <slot></slot>
  </StyledButton>
</template>
```

Will now correctly include the `test` class in the final output.
