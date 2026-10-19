<script setup lang="ts">
import * as s from './PageSection.css'

defineProps<{ title: string }>()
</script>

<template>
  <section :class="s.section">
    <h2 :class="s.title">{{ title }}</h2>
    <slot />
  </section>
</template>
