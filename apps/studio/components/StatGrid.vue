<script setup lang="ts">
import * as s from './StatGrid.css'

defineProps<{ items: { label: string; value: string | number; tone?: 'danger' | 'warning' }[] }>()
</script>

<template>
  <dl :class="s.grid" :style="{ '--columns': items.length }">
    <div v-for="item in items" :key="item.label" :class="s.stat" :data-tone="item.tone">
      <dt>{{ item.label }}</dt>
      <dd>{{ item.value }}</dd>
    </div>
  </dl>
</template>
