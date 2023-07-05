<script lang="ts">
import { ref } from 'vue'
import { css } from '../styled-system/css'

export default {
  name: 'CompositionApiDemo',
  setup() {
    const style = ref(css({ color: 'green.400' }))

    return { style }
  },
  methods: {
    css,
  },
}
</script>

<template>
  <h1 :class="style">using class binding</h1>
  <p :class="css({ color: 'red.500' })">using inline styles</p>
  <span class="style3">using actual class</span>
</template>

<style scoped>
.style3 {
  font-weight: bold;
}
</style>
