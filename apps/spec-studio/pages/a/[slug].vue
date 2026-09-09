<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import * as s from "../analyze.styles";
import { button } from "styled-system/recipes";
import type { CategoryUsage } from "~/utils/analyze";
import type { TokensFile } from "~/utils/tokens";
import { droppedFiles } from "~/utils/dropped";
import { useAnalyze } from "~/composables/useAnalyze";

type Usage = { report: CategoryUsage[]; scannedCount: number; mode: "heuristic" | "precise" };

const route = useRoute();
const slug = String(route.params.slug);

useHead({
  title: "Usage — Panda Spec Studio",
  meta: [{ name: "robots", content: "noindex" }],
});

const { data } = await useFetch<{ title: string | null; tokens: TokensFile; usage: Usage | null }>(
  `/api/specs/${slug}`,
);
if (!data.value?.tokens) throw createError({ statusCode: 404, statusMessage: "Spec not found" });

const {
  file,
  report,
  scannedCount,
  empty,
  mode,
  analyzing,
  preciseFailed,
  preciseError,
  analyzeFiles,
  reset,
  dragging,
  busy,
  onPick,
  onDrop,
  onDragOver,
  onDragLeave,
} = useAnalyze();

file.value = data.value.tokens;
if (data.value.usage?.report) {
  report.value = data.value.usage.report;
  scannedCount.value = data.value.usage.scannedCount ?? 0;
  mode.value = data.value.usage.mode ?? "heuristic";
}

const scopeCategory = computed(() => String(route.query.category ?? ""));
const scopedReport = computed(() => {
  if (!report.value) return [];
  if (!scopeCategory.value) return report.value;
  const scoped = report.value.filter((c) => c.type === scopeCategory.value);
  return scoped.length ? scoped : report.value;
});

const noUsage = computed(() => !!report.value?.length && report.value.every((c) => c.used === 0));

async function onScope(v: string) {
  await navigateTo({ path: `/a/${slug}`, query: v ? { category: v } : {} });
}

async function persist() {
  if (!report.value) return;
  await $fetch(`/api/specs/${slug}`, {
    method: "PATCH",
    body: { usage: { report: report.value, scannedCount: scannedCount.value, mode: mode.value } },
  }).catch(() => {});
}
watch(report, (r) => {
  if (r) persist();
});

const copied = ref(false);
async function copyLink() {
  try {
    await navigator.clipboard.writeText(location.href);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    return;
  }
}

onMounted(async () => {
  if (report.value) return;
  if (droppedFiles.value.length) await analyzeFiles(droppedFiles.value);
});
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
      <p :class="s.lede">
        Which tokens this system actually uses, which are unused, and which are hot — per category.
      </p>
    </div>

    <div v-if="busy || analyzing" :class="s.analyzing">
      <span :class="s.spinner" />
      {{ busy && !analyzing ? "Reading your files…" : "Analyzing your source…" }}
    </div>

    <template v-else-if="!report">
      <div
        :class="s.dropzone"
        :data-dragging="dragging || undefined"
        @drop="onDrop"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
      >
        <p :class="s.dropHint">
          This system has no usage analysis yet. Drop your <strong>source</strong> folder or the
          whole repo and it'll scan which of these tokens you actually use.
        </p>
        <p :class="s.note">
          Include your <code>panda.config.ts</code> for <strong>compiler-grade</strong> results — the
          real Panda compiler runs in your browser. Without it, a name-match scan runs.
        </p>
        <label :class="button({ variant: 'solid' })">
          Choose folder
          <input type="file" webkitdirectory multiple hidden @change="onPick" />
        </label>
      </div>
      <p v-if="empty" :class="s.note">
        No app source found in that drop — build output (<code>styled-system/</code>,
        <code>node_modules/</code>, <code>dist/</code>) is skipped. Drop your <code>app/</code> or
        <code>src/</code> folder, or the whole repo.
      </p>
    </template>

    <template v-else>
      <div :class="s.toolbar">
        <span :class="s.scanned">
          <span :class="s.badge" :data-precise="mode === 'precise'">{{
            mode === "precise" ? "compiler-grade" : "heuristic"
          }}</span>
          Scanned {{ scannedCount }} file{{ scannedCount === 1 ? "" : "s" }}
        </span>
        <div :class="s.toolbarActions">
          <CategorySelect
            :categories="report.map((c) => c.type)"
            :category="scopeCategory"
            @change="onScope"
          />
          <button :class="button({ variant: 'outline', size: 'sm' })" @click="copyLink">
            {{ copied ? "Link copied" : "Copy link" }}
          </button>
          <button :class="button({ variant: 'outline', size: 'sm' })" @click="reset">
            Scan other files
          </button>
        </div>
      </div>

      <p v-if="noUsage" :class="s.diag">
        Found <strong>0 token references</strong> in {{ scannedCount }} file{{
          scannedCount === 1 ? "" : "s"
        }}. The dropped source probably doesn't match this system.
      </p>
      <p v-else-if="preciseFailed" :class="s.hint">
        Name-match scan — the compiler couldn't read this <code>panda.config</code><template
          v-if="preciseError"
        >: <code>{{ preciseError }}</code></template
        >.
      </p>

      <AnalyzeReport :report="scopedReport" />
    </template>
  </div>
</template>
