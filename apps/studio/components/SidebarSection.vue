<script setup lang="ts">
import * as s from './SidebarSection.css'

defineProps<{ label?: string }>()
</script>

<template>
  <section :class="s.section">
    <h2 v-if="label" :class="s.label">{{ label }}</h2>
    <div :class="s.items">
      <slot />
    </div>
  </section>
</template>
