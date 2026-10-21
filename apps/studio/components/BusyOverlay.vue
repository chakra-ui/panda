<script setup lang="ts">
import * as s from './BusyOverlay.css'

defineProps<{ label: string }>()
</script>

<template>
  <div :class="s.overlay" role="status">
    <div :class="s.card">
      <Spinner />
      <span>{{ label }}</span>
    </div>
  </div>
</template>
