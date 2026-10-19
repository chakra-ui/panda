<script setup lang="ts">
import * as s from './PageHeader.css'

defineProps<{ title: string; description?: string }>()
</script>

<template>
  <header :class="s.header">
    <div :class="s.text">
      <h1 :class="s.title">{{ title }}</h1>
      <p v-if="description || $slots.description" :class="s.description">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" :class="s.actions">
      <slot name="actions" />
    </div>
  </header>
</template>
