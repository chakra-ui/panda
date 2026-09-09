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

    <p v-if="scopeCategory" :class="s.scopeNote">
      Scoped to <strong>{{ scopeCategory }}</strong>
      <NuxtLink :to="`/a/${slug}`" :class="s.scopeClear">Show all categories</NuxtLink>
    </p>
    <AnalyzeReport :report="scopedReport" />
  </div>
</template>
