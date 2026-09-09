<script setup lang="ts">
import { computed } from "vue";
import * as s from "../analyze.styles";
import type { CategoryUsage } from "~/utils/analyze";

type Usage = { report: CategoryUsage[]; scannedCount: number; mode: "heuristic" | "precise" };

const route = useRoute();
const slug = String(route.params.slug);

useHead({ title: "Shared usage — Panda Spec Studio", meta: [{ name: "robots", content: "noindex" }] });

const { data } = await useFetch<{ title: string | null; usage: Usage | null }>(`/api/specs/${slug}`);
if (!data.value?.usage?.report) throw createError({ statusCode: 404, statusMessage: "No usage analysis here" });

const usage = data.value.usage;
const scopeCategory = computed(() => String(route.query.category ?? ""));
const scopedReport = computed(() =>
  scopeCategory.value ? usage.report.filter((c) => c.type === scopeCategory.value) : usage.report,
);

async function onScope(e: Event) {
  const v = (e.target as HTMLSelectElement).value;
  await navigateTo({ path: `/a/${slug}`, query: v ? { category: v } : {} });
}
</script>

<template>
  <div :class="s.wrap">
    <NuxtLink :to="`/s/${slug}`" :class="s.back">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back to tokens
    </NuxtLink>

    <div :class="s.head">
      <h1 :class="s.title">Usage analysis</h1>
      <p :class="s.lede">Which tokens this system actually uses, which are unused, and which are hot — per category.</p>
    </div>

    <div :class="s.toolbar">
      <span :class="s.scanned">
        <span :class="s.badge" :data-precise="usage.mode === 'precise'">{{
          usage.mode === "precise" ? "compiler-grade" : "heuristic"
        }}</span>
        Scanned {{ usage.scannedCount }} file{{ usage.scannedCount === 1 ? "" : "s" }}
      </span>
    </div>

    <div :class="s.scopeBar">
      <label :class="s.scopeLabel" for="scope-cat">Category</label>
      <div :class="s.scopeSelectWrap">
        <select id="scope-cat" :class="s.scopeSelect" :value="scopeCategory" @change="onScope">
          <option value="">All categories</option>
          <option v-for="c in usage.report" :key="c.type" :value="c.type">
            {{ c.type }} · {{ c.used }}/{{ c.total }}
          </option>
        </select>
        <svg
          :class="s.scopeChevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
    <AnalyzeReport :report="scopedReport" />
  </div>
</template>
