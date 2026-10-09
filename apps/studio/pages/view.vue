<script setup lang="ts">
import { ref } from "vue";
import * as s from "./view.styles";
import { button } from "styled-system/recipes";
import { index, parseSpec, type DesignSystemIndex } from "~/utils/design-system";
import { loadTokens, loadUsage, saveUsage, saveTokens, clearTokens } from "~/utils/idb";
import { readHandoff, readWatchMessage, receiveHandoff } from "~/utils/handoff";
import { droppedFiles } from "~/utils/dropped";
import { useAnalyze } from "~/composables/useAnalyze";

useHead({
  title: "Your system — Panda Studio",
  meta: [{ name: "robots", content: "noindex" }],
});

const ds = ref<DesignSystemIndex | null>(null);
const ready = ref(false);
const usage = ref<unknown>(null);
const invalid = ref(false);

const analyze = useAnalyze();
const router = useRouter();

const reloadOnNewLink = () => readHandoff(window.location) && location.reload();

function onWatchMessage(event: MessageEvent) {
  const json = readWatchMessage(event, window.parent);
  const parsed = json ? parseSpec(json) : null;
  if (!parsed?.ok) return;
  ds.value = index(parsed.spec);
  ready.value = true;
}

onUnmounted(() => {
  window.removeEventListener("hashchange", reloadOnNewLink);
  window.removeEventListener("message", onWatchMessage);
});

onNuxtReady(async () => {
  if (window.parent !== window) {
    window.addEventListener("message", onWatchMessage);
    window.parent.postMessage({ type: "panda-studio:ready" }, "*");
    return;
  }

  window.addEventListener("hashchange", reloadOnNewLink);
  const handoff = readHandoff(window.location);
  let handedOff: DesignSystemIndex | null = null;
  if (handoff) {
    const received = await receiveHandoff(handoff);
    await router.replace({ path: "/view" });
    const parsed = received ? parseSpec(received) : null;
    if (!received || !parsed?.ok) {
      invalid.value = true;
      return;
    }
    handedOff = index(parsed.spec);
    try {
      await clearTokens();
      await saveTokens(received);
    } catch {}
  }

  if (handedOff) {
    ds.value = handedOff;
  } else {
    const raw = await loadTokens();
    const result = raw ? parseSpec(raw) : null;
    if (!result?.ok) {
      await navigateTo("/");
      return;
    }
    ds.value = index(result.spec);
  }
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

const copied = ref(false);

async function copyCommand() {
  await navigator.clipboard.writeText("panda studio");
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}

async function reset() {
  await clearTokens();
  await navigateTo("/");
}
</script>

<template>
  <TokenView v-if="ready && ds" :ds="ds" :usage="usage" :analyze-href="'/analyze'" @reset="reset" />
  <div v-else-if="invalid" :class="s.invalid">
    <svg
      :class="s.invalidIcon"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
    <h1 :class="s.invalidTitle">This link is incomplete</h1>
    <p :class="s.invalidBody">
      Part of it was likely cut off when it was copied. Run this in your project for a fresh one.
    </p>
    <div :class="s.command">
      <code><span :class="s.prompt">$</span> panda studio</code>
      <button type="button" :class="s.copy" @click="copyCommand">
        {{ copied ? "Copied" : "Copy" }}
      </button>
    </div>
    <NuxtLink to="/" :class="button({ variant: 'outline' })">Load a file instead</NuxtLink>
  </div>
  <div v-else :class="s.loading">
    <img src="/panda.svg" alt="" :class="s.loadingLogo" />
    <span :class="s.loadingSpinner" />
    Loading your system…
  </div>
</template>
