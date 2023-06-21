<script lang="ts">
import { ref } from 'vue'
import { css } from '../styled-system/css'

export default {
  name: 'CompositionApiDemo',
  setup() {
    const style = ref(css({ color: 'green.400' }))
    const style2 = ref(css({ color: 'purple.400' }))

    return { style, style2 }
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
button {
  font-weight: bold;
}
</style>
