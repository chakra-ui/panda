<script setup lang="ts">
import * as s from './StatGrid.css'

defineProps<{ items: { label: string; value: string | number; total?: number; tone?: 'danger' | 'warning' }[] }>()
</script>

<template>
  <dl :class="s.grid" :style="{ '--columns': items.length }">
    <div v-for="item in items" :key="item.label" :class="s.stat" :data-tone="item.tone">
      <dt>{{ item.label }}</dt>
      <dd>
        {{ item.value }}<span v-if="item.total != null" :class="s.total">/{{ item.total }}</span>
      </dd>
    </div>
  </dl>
</template>
