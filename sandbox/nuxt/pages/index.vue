<script setup lang="ts">
import * as Custom from '../components/custom'

const inputRef = ref('Hello')
</script>

<template>
  <p>{{ inputRef }}</p>
  <Custom.Root>
    <Custom.Label>Hello</Custom.Label>
    <Custom.Input v-model="inputRef" />
  </Custom.Root>
</template>
