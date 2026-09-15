<script setup lang="ts">
import { ref } from "vue";
import * as s from "./view.styles";
import { index, parseSpec, type DesignSystemIndex } from "~/utils/design-system";
import { loadTokens, loadUsage, saveUsage, clearTokens } from "~/utils/idb";
import { droppedFiles } from "~/utils/dropped";
import { useAnalyze } from "~/composables/useAnalyze";

useHead({
  title: "Your system — Panda Studio",
  meta: [{ name: "robots", content: "noindex" }],
});

const ds = ref<DesignSystemIndex | null>(null);
const ready = ref(false);
const usage = ref<unknown>(null);

const analyze = useAnalyze();

onMounted(async () => {
  const raw = await loadTokens();
  const result = raw ? parseSpec(raw) : null;
  if (!result?.ok) {
    await navigateTo("/");
    return;
  }
  ds.value = index(result.spec);
  usage.value = await loadUsage();
  ready.value = true;

  if (!usage.value && droppedFiles.value.length) {
    analyze.ds.value = ds.value;
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

async function reset() {
  await clearTokens();
  await navigateTo("/");
}
</script>

<template>
  <TokenView
    v-if="ready && ds"
    :ds="ds"
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
