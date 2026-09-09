<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { VueUiDonut, VueUiVerticalBar } from "vue-data-ui";
import * as s from "./AnalyzeCharts.styles";
import type { CategoryUsage } from "~/utils/analyze";

const props = defineProps<{ report: CategoryUsage[] }>();

const ACCENT = "#7c6cff";
const GREY = "#8a8a92";

const isDark = ref(false);
onMounted(() => {
  isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
});
const INK = computed(() => (isDark.value ? "#ededed" : "#0a0a0a"));
const MUTED = computed(() => (isDark.value ? "#2e2e38" : "#e4e4ec"));

const totals = computed(() => {
  const used = props.report.reduce((a, c) => a + c.used, 0);
  const total = props.report.reduce((a, c) => a + c.total, 0);
  return {
    used,
    unused: total - used,
    total,
    percent: total ? Math.round((used / total) * 100) : 0,
  };
});

const topToken = computed(() => {
  const all = props.report.flatMap((c) =>
    c.tokens.filter((t) => t.uses > 0).map((t) => ({ name: `${c.type}.${t.name}`, uses: t.uses })),
  );
  return all.toSorted((a, b) => b.uses - a.uses)[0] ?? null;
});

const donutDataset = computed(() => [
  { name: "used", values: [totals.value.used], color: ACCENT },
  { name: "unused", values: [totals.value.unused], color: MUTED.value },
]);

const donutConfig = computed(() => ({
  responsive: true,
  userOptions: { show: false },
  style: {
    chart: {
      backgroundColor: "transparent",
      color: GREY,
      title: { show: false },
      legend: { show: true, backgroundColor: "transparent", color: GREY, fontSize: 13 },
      tooltip: {
        show: true,
        backgroundColor: INK.value,
        color: isDark.value ? "#0a0a0a" : "#ffffff",
      },
      layout: {
        useGradient: true,
        gradientIntensity: 30,
        donut: { strokeWidth: 64 },
        labels: {
          dataLabels: { show: false },
          value: { show: false },
          percentage: { show: false },
          name: { show: false },
          hollow: {
            total: { show: false },
            average: { show: false },
          },
        },
      },
    },
  },
}));

const bars = computed(() =>
  props.report
    .flatMap((c) =>
      c.tokens
        .filter((t) => t.uses > 0)
        .map((t) => ({ name: `${c.type}.${t.name}`, uses: t.uses })),
    )
    .toSorted((a, b) => b.uses - a.uses)
    .slice(0, 8)
    .map((t) => ({ name: t.name, value: t.uses, color: ACCENT })),
);

const barConfig = computed(() => ({
  userOptions: { show: false },
  table: { show: false },
  style: {
    chart: {
      backgroundColor: "transparent",
      color: INK.value,
      title: { show: false },
      legend: { show: false },
      layout: {
        bars: {
          sort: "desc",
          borderRadius: 6,
          gradient: { show: true, intensity: 40 },
          dataLabels: { color: GREY },
          nameLabels: { color: GREY },
        },
        highlighter: { color: ACCENT },
      },
    },
  },
}));
</script>

<template>
  <div :class="s.grid">
    <div :class="s.card">
      <div :class="s.head">
        <span :class="s.title">
          <svg
            :class="s.icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 12V2a10 10 0 0 1 10 10z" />
          </svg>
          Coverage
        </span>
        <span :class="s.meta">{{ totals.total }} tokens</span>
      </div>
      <div :class="s.stat">{{ totals.percent }}%</div>
      <div :class="s.statSub">
        {{ totals.used }} of {{ totals.total }} tokens used in your source
      </div>
      <div :class="s.donutBox">
        <VueUiDonut :dataset="donutDataset" :config="donutConfig" />
      </div>
    </div>

    <div :class="s.card">
      <div :class="s.head">
        <span :class="s.title">
          <svg
            :class="s.icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="M18 17V9M13 17V5M8 17v-3" />
          </svg>
          Hottest tokens
        </span>
        <span :class="s.meta">top 8</span>
      </div>
      <div :class="s.statMono">{{ topToken?.name ?? "—" }}</div>
      <div :class="s.statSub">most-used token{{ topToken ? ` · ×${topToken.uses}` : "" }}</div>
      <div :class="s.barBox">
        <VueUiVerticalBar :dataset="bars" :config="barConfig" />
      </div>
    </div>
  </div>
</template>
