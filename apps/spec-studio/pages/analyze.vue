<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import * as s from "./analyze.styles";
import { button } from "styled-system/recipes";
import { parseTokens, type TokensFile } from "~/utils/tokens";
import { extractTokens } from "~/utils/extract-tokens";
import { loadTokens, saveTokens, saveTokenCss } from "~/utils/idb";
import {
  analyzeUsage,
  isSourceFile,
  isIgnoredPath,
  MAX_FILE_BYTES,
  MAX_FILES,
  type CategoryUsage,
} from "~/utils/analyze";
import { droppedFiles } from "~/utils/dropped";
import { useFolderDrop } from "~/composables/useFolderDrop";

useHead({
  title: "Analyze usage — Panda Spec Studio",
  meta: [{ name: "robots", content: "noindex" }],
});

const file = ref<TokensFile | null>(null);
const report = ref<CategoryUsage[] | null>(null);
const scannedCount = ref(0);
const empty = ref(false);
const mode = ref<"heuristic" | "precise">("heuristic");
const analyzing = ref(false);
const preciseFailed = ref(false);

const noUsage = computed(() => !!report.value?.length && report.value.every((c) => c.used === 0));

const fromDrop = ref(false);

onMounted(async () => {
  const raw = await loadTokens();
  const result = raw ? parseTokens(raw) : null;
  if (result?.ok) file.value = result.file;
  else {
    await navigateTo("/");
    return;
  }
  if (droppedFiles.value.length) {
    fromDrop.value = true;
    await analyzeFiles(droppedFiles.value);
  }
});

const sorted = computed(() =>
  report.value ? report.value.toSorted((a, b) => a.percent - b.percent || b.unused - a.unused) : [],
);

function mapPrecise(rep: {
  facts?: { tokens?: { path: string; category: string }[] };
  views?: {
    tokens?: {
      categories?: {
        category: string;
        total: number;
        used: number;
        unused: number;
        percentUsed: number;
        top?: { name: string; uses: number }[];
      }[];
    };
  };
}): CategoryUsage[] {
  const byCat = new Map<string, string[]>();
  for (const t of rep.facts?.tokens ?? []) {
    const name = t.path.startsWith(`${t.category}.`) ? t.path.slice(t.category.length + 1) : t.path;
    const list = byCat.get(t.category) ?? [];
    list.push(name);
    byCat.set(t.category, list);
  }
  return (rep.views?.tokens?.categories ?? []).map((c) => {
    const usedNames = new Set((c.top ?? []).filter((t) => t.uses > 0).map((t) => t.name));
    const unusedNames = (byCat.get(c.category) ?? []).filter((n) => !usedNames.has(n));
    return {
      type: c.category,
      total: c.total,
      used: c.used,
      unused: c.unused,
      percent: c.percentUsed,
      tokens: [
        ...(c.top ?? []).map((t) => ({ name: t.name, uses: t.uses })),
        ...unusedNames.map((n) => ({ name: n, uses: 0 })),
      ],
    };
  });
}

const pathOf = (f: File) =>
  (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;

const { dragging, busy, onPick, onDrop, onDragOver, onDragLeave } = useFolderDrop(analyzeFiles);

async function analyzeFiles(input: File[]) {
  const { tokensJson, css } = await extractTokens(input);
  if (tokensJson) {
    const parsed = parseTokens(tokensJson);
    if (parsed.ok) {
      file.value = parsed.file;
      await saveTokens(tokensJson);
      await saveTokenCss(css);
    }
  }

  if (!file.value) return;
  const textFiles = input
    .filter((f) => {
      const path = pathOf(f);
      if (isIgnoredPath(path) || f.size > MAX_FILE_BYTES) return false;
      return isSourceFile(f.name) || /panda\.config\.|\.(ts|tsx|js|jsx|mjs|cjs|json)$/.test(f.name);
    })
    .slice(0, MAX_FILES);

  analyzing.value = true;
  preciseFailed.value = false;
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const filesMap = new Map<string, string>();
  const sources: { name: string; text: string }[] = [];
  await Promise.all(
    textFiles.map(async (f) => {
      const path = pathOf(f);
      const text = await f.text();
      filesMap.set(path, text);
      if (isSourceFile(f.name)) sources.push({ name: path, text });
    }),
  );
  scannedCount.value = sources.length;
  empty.value = sources.length === 0;
  if (!sources.length) {
    report.value = null;
    analyzing.value = false;
    return;
  }

  const { findConfig, analyzePrecise } = await import("~/utils/analyze-compiler");
  const configPath = findConfig(filesMap);
  if (configPath && import.meta.client) {
    try {
      const rep = await analyzePrecise({ configPath, files: filesMap, sources });
      report.value = mapPrecise(rep as never);
      mode.value = "precise";
      analyzing.value = false;
      return;
    } catch {
      preciseFailed.value = true;
    }
  }
  mode.value = "heuristic";
  report.value = analyzeUsage(file.value, sources);
  analyzing.value = false;
}

function reset() {
  report.value = null;
  scannedCount.value = 0;
  empty.value = false;
  mode.value = "heuristic";
  preciseFailed.value = false;
}
</script>

<template>
  <div :class="s.wrap">
    <NuxtLink to="/view" :class="s.back">
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
      <h1 :class="s.title">Analyze usage</h1>
      <p :class="s.lede">
        Drop your source files (or your repo folder) and see which tokens are actually used, which
        are unused, and which are hot — per category.
      </p>
      <p :class="s.note">
        Include your <code>panda.config.ts</code> in the drop for <strong>compiler-grade</strong>
        results (the real Panda compiler runs in your browser via
        <code>@pandacss/compiler-wasm</code>). Without it, a heuristic name-match scan runs —
        accurate for named tokens, approximate for bare-numeric ones.
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
          Drop source files or a whole repo —
          <code>.ts .tsx .vue .jsx .svelte .astro .css</code>
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
        <button :class="button({ variant: 'outline', size: 'sm' })" @click="reset">
          Scan other files
        </button>
      </div>

      <p v-if="noUsage" :class="s.diag">
        Found <strong>0 token references</strong> in {{ scannedCount }} file{{
          scannedCount === 1 ? "" : "s"
        }}. The loaded tokens probably don't match this project — load this project's own
        <code>tokens.json</code> (run <code>panda codegen</code>). Note this tool targets
        <strong>Panda v2</strong>.
      </p>
      <p v-else-if="preciseFailed" :class="s.diag">
        Couldn't run the compiler on that <code>panda.config</code> (custom preset, local imports,
        or Panda v1) — showing the heuristic name-match scan instead.
      </p>

      <ClientOnly>
        <AnalyzeCharts v-if="report" :report="report" />
      </ClientOnly>

      <div :class="s.cards">
        <div v-for="c in sorted" :key="c.type" :class="s.card">
          <div :class="s.cardHead">
            <span :class="s.cType">{{ c.type }}</span>
            <span :class="s.cPct">{{ c.used }}/{{ c.total }} used · {{ c.percent }}%</span>
          </div>
          <div :class="s.track"><div :class="s.fill" :style="{ width: c.percent + '%' }" /></div>

          <div v-if="c.used" :class="s.hot">
            <span
              v-for="t in c.tokens.filter((t) => t.uses > 0).slice(0, 6)"
              :key="t.name"
              :class="s.hotTok"
            >
              {{ t.name }} <b>×{{ t.uses }}</b>
            </span>
          </div>

          <p v-if="c.unused" :class="s.unused">
            <span :class="s.unusedLabel">{{ c.unused }} unused —</span>
            {{
              c.tokens
                .filter((t) => !t.uses)
                .slice(0, 10)
                .map((t) => t.name)
                .join(", ")
            }}{{ c.unused > 10 ? "…" : "" }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
