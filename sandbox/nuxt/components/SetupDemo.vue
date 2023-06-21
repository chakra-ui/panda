<script setup lang="ts">
import { css } from '../styled-system/css'

let style = css({ color: 'green.400' })
let style2 = css({ color: 'purple.400' })
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
