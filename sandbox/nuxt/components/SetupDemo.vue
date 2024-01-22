<script setup lang="ts">
import { css } from '../styled-system/css'
import { Flex } from '../styled-system/jsx/flex'

let style = css({ color: 'green.400' })
const obj = { color: 'red.300' }
</script>

<template>
  <h1 :class="style">using class binding</h1>
  <p :class="css({ color: 'red.500' })">using inline styles</p>
  <span class="style3">using actual class</span>
  <Flex :css="obj">using pattern + css override</Flex>
</template>

<style scoped>
.style3 {
  font-weight: bold;
}
</style>
