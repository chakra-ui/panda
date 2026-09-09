<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import * as s from "./analyze.styles";
import { button } from "styled-system/recipes";
import { parseTokens } from "~/utils/tokens";
import { loadTokens, saveUsage, loadUsage } from "~/utils/idb";
import type { CategoryUsage } from "~/utils/analyze";
import { droppedFiles } from "~/utils/dropped";
import { useAnalyze } from "~/composables/useAnalyze";
import { useShareSpec } from "~/composables/useShareSpec";

const { status: shareStatus, share } = useShareSpec();
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

useHead({
  title: "Analyze usage — Panda Spec Studio",
  meta: [{ name: "robots", content: "noindex" }],
});

const route = useRoute();
const scopeCategory = computed(() => String(route.query.category ?? ""));
const scopedReport = computed(() => {
  if (!report.value) return [];
  if (!scopeCategory.value) return report.value;
  const scoped = report.value.filter((c) => c.type === scopeCategory.value);
  return scoped.length ? scoped : report.value;
});

const noUsage = computed(() => !!report.value?.length && report.value.every((c) => c.used === 0));

async function onScope(v: string) {
  await navigateTo({ path: "/analyze", query: v ? { category: v } : {} });
}

const usageSnapshot = computed(() =>
  report.value
    ? { report: report.value, scannedCount: scannedCount.value, mode: mode.value }
    : null,
);
watch(usageSnapshot, (u) => saveUsage(u));

function shareReport() {
  if (!file.value || !usageSnapshot.value) return;
  share(file.value, null, { title: "usage", path: "a", usage: usageSnapshot.value });
}

onMounted(async () => {
  const raw = await loadTokens();
  const result = raw ? parseTokens(raw) : null;
  if (result?.ok) file.value = result.file;
  if (droppedFiles.value.length) {
    await analyzeFiles(droppedFiles.value);
    return;
  }
  const saved = await loadUsage<{
    report: CategoryUsage[];
    scannedCount: number;
    mode: "heuristic" | "precise";
  }>();
  if (saved?.report?.length) {
    report.value = saved.report;
    scannedCount.value = saved.scannedCount ?? 0;
    mode.value = saved.mode ?? "heuristic";
  }
});
</script>

<template>
  <div :class="s.wrap">
    <NuxtLink v-if="file" to="/view" :class="s.back">
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
      View tokens
    </NuxtLink>

    <div :class="s.head">
      <h1 :class="s.title">Analyze usage</h1>
      <p :class="s.lede">
        See which tokens your code actually uses, which are unused, and which are hot — per category.
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
        <p v-if="file" :class="s.dropHint">
          Your tokens are loaded, but usage needs your <strong>source</strong>. Drop your app folder
          or the whole repo and it'll scan which tokens you actually use.
        </p>
        <p v-else :class="s.dropHint">
          Drop your source folder or the whole repo. You'll get the usage analysis — and you can view
          its tokens too.
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
            v-if="report"
            :categories="report.map((c) => c.type)"
            :category="scopeCategory"
            @change="onScope"
          />
          <button
            :class="button({ variant: 'outline', size: 'sm' })"
            :disabled="shareStatus === 'sharing'"
            @click="shareReport"
          >
            {{ shareStatus === "sharing" ? "Sharing…" : "Share" }}
          </button>
          <button :class="button({ variant: 'outline', size: 'sm' })" @click="reset">
            Scan other files
          </button>
        </div>
      </div>

      <p v-if="noUsage" :class="s.diag">
        Found <strong>0 token references</strong> in {{ scannedCount }} file{{
          scannedCount === 1 ? "" : "s"
        }}. The loaded tokens probably don't match this project — load this project's own
        <code>tokens.json</code> (run <code>panda codegen</code>). Note this tool targets
        <strong>Panda v2</strong>.
      </p>
      <p v-else-if="preciseFailed" :class="s.hint">
        Name-match scan — the compiler couldn't read this <code>panda.config</code><template
          v-if="preciseError"
        >: <code>{{ preciseError }}</code></template
        >.
      </p>

      <AnalyzeReport v-if="report" :report="scopedReport" />
    </template>
  </div>
</template>
