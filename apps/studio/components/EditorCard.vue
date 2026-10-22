<script setup lang="ts">
import * as s from './EditorCard.css'

defineProps<{ title: string }>()
</script>

<template>
  <div :class="s.card">
    <div :class="s.bar">
      <span :class="s.title" :title="title">{{ title }}</span>
      <slot name="status" />
      <span :class="s.actions"><slot name="actions" /></span>
    </div>
    <slot />
  </div>
</template>
