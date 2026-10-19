<script setup lang="ts">
import { computed } from 'vue'
import * as s from './AnalyzeReport.css'
import type { CategoryUsage } from '~/utils/analyze'

const props = defineProps<{ report: CategoryUsage[] }>()

const sorted = computed(() => props.report.toSorted((a, b) => a.percent - b.percent || b.unused - a.unused))
</script>

<template>
  <ClientOnly>
    <AnalyzeCharts :report="report" />
  </ClientOnly>

  <div :class="s.cards">
    <div v-for="c in sorted" :key="c.type" :class="s.card.root">
      <div :class="s.card.head">
        <span :class="s.card.title">{{ c.type }}</span>
        <span :class="s.card.percent">{{ c.used }}/{{ c.total }} used · {{ c.percent }}%</span>
      </div>
      <div :class="s.meter.track"><div :class="s.meter.fill" :style="{ width: c.percent + '%' }" /></div>

      <div v-if="c.used" :class="s.hot.list">
        <span v-for="t in c.tokens.filter((t) => t.uses > 0).slice(0, 6)" :key="t.name" :class="s.hot.token">
          {{ t.name }} <b>×{{ t.uses }}</b>
        </span>
      </div>

      <p v-if="c.unused" :class="s.unused.text">
        <span :class="s.unused.label">{{ c.unused }} unused —</span>
        {{
          c.tokens
            .filter((t) => !t.uses)
            .slice(0, 10)
            .map((t) => t.name)
            .join(', ')
        }}{{ c.unused > 10 ? '…' : '' }}
      </p>
    </div>
  </div>
</template>
