<script setup>
import { styled } from '../styled-system/jsx'

const StyledButton = styled('button', {
  base: {
    bgColor: 'black',
  },
  variants: {
    vColor: {
      default: {
        bgColor: 'pink',
      },
      error: {
        bgColor: 'red',
      },
      warning: {
        bgColor: 'yellow',
      },
      info: {
        bgColor: 'cyan',
      },
      secondary: {
        bgColor: 'green',
      },
    },
  },
})
</script>
<template>
  <StyledButton id="test" class="test">
    <slot></slot>
  </StyledButton>
</template>
