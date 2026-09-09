<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as s from "./view.styles";
import { parseTokens, type TokensFile } from "~/utils/tokens";
import { buildThemeLayer, type Variant } from "~/utils/token-model";
import { loadTokens, loadTokenCss, loadUsage, saveUsage, clearTokens } from "~/utils/idb";
import { droppedFiles } from "~/utils/dropped";
import { useAnalyze } from "~/composables/useAnalyze";

useHead({
  title: "Your system — Panda Spec Studio",
  meta: [{ name: "robots", content: "noindex" }],
});

const STYLE_ID = "panda-spec-token-vars";
const file = ref<TokensFile | null>(null);
const ready = ref(false);
const resolveVars = ref(false);
const variants = ref<Variant[]>([]);
const themeCss = ref<string | null>(null);
const usage = ref<unknown>(null);

const analyze = useAnalyze();

onMounted(async () => {
  const raw = await loadTokens();
  const result = raw ? parseTokens(raw) : null;
  if (!result?.ok) {
    await navigateTo("/");
    return;
  }
  file.value = result.file;
  usage.value = await loadUsage();
  ready.value = true;

  const rawCss = await loadTokenCss();
  if (rawCss) {
    const theme = buildThemeLayer(rawCss);
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = theme.css;
    document.head.appendChild(el);
    resolveVars.value = true;
    variants.value = theme.variants;
    themeCss.value = theme.css;
  }

  if (!usage.value && droppedFiles.value.length) {
    analyze.file.value = file.value;
    await analyze.analyzeFiles(droppedFiles.value);
    if (analyze.report.value) {
      const snapshot = {
        report: analyze.report.value,
        scannedCount: analyze.scannedCount.value,
        mode: analyze.mode.value,
      };
      await saveUsage(snapshot);
      usage.value = snapshot;
    }
  }
});

onBeforeUnmount(() => document.getElementById(STYLE_ID)?.remove());

async function reset() {
  await clearTokens();
  await navigateTo("/");
}
</script>

<template>
  <TokenView
    v-if="ready && file"
    :file="file"
    :resolve-vars="resolveVars"
    :variants="variants"
    :css="themeCss"
    :usage="usage"
    :analyze-href="'/analyze'"
    @reset="reset"
  />
  <div v-else :class="s.loading">
    <img src="/panda.svg" alt="" :class="s.loadingLogo" />
    <span :class="s.loadingSpinner" />
    Loading your system…
  </div>
</template>
