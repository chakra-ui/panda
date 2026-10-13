<script setup lang="ts">
import { ref } from "vue";
import * as s from "./view.styles";
import { button } from "styled-system/recipes";
import { index, parseSpec, type DesignSystemIndex } from "~/utils/design-system";
import { loadTokens, loadUsage, saveUsage, saveTokens, clearTokens } from "~/utils/idb";
import { isWatchFrame, readHandoff, readWatchMessage, receiveHandoff } from "~/utils/handoff";
import { droppedFiles } from "~/utils/dropped";
import { toaster } from "~/utils/toaster";
import { useAnalyze } from "~/composables/useAnalyze";

useHead({
  title: "Your system — Panda Studio",
  meta: [{ name: "robots", content: "noindex" }],
});

const ds = ref<DesignSystemIndex | null>(null);
const ready = ref(false);
const usage = ref<unknown>(null);
const invalid = ref<"incomplete" | "unreadable" | null>(null);

const analyze = useAnalyze();
const router = useRouter();

const reloadOnNewLink = () => readHandoff(window.location) && location.reload();

function onWatchMessage(event: MessageEvent) {
  const json = readWatchMessage(event, window.parent);
  if (!json) return;
  const parsed = parseSpec(json);
  if (!parsed.ok) {
    if (ds.value) {
      toaster.create({ type: "error", title: "Studio can't read the updated design system", description: parsed.error });
    } else {
      invalid.value = "unreadable";
    }
    return;
  }
  ds.value = index(parsed.spec);
  ready.value = true;
}

onUnmounted(() => {
  window.removeEventListener("hashchange", reloadOnNewLink);
  window.removeEventListener("message", onWatchMessage);
});

onNuxtReady(async () => {
  if (isWatchFrame(window, document.referrer)) {
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
      invalid.value = received ? "unreadable" : "incomplete";
      return;
    }
    handedOff = index(parsed.spec);
    await clearTokens();
    if (!(await saveTokens(received))) {
      toaster.create({
        type: "error",
        title: "Studio couldn't save this design system",
        description: "Your browser blocked storage, so it will be gone after a reload. Run panda studio again to reopen it.",
      });
    }
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

const copyLabel = ref("Copy");

async function copyCommand() {
  try {
    await navigator.clipboard.writeText("panda studio");
    copyLabel.value = "Copied";
  } catch {
    copyLabel.value = "Couldn't copy";
  }
  setTimeout(() => (copyLabel.value = "Copy"), 1500);
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
    <h1 :class="s.invalidTitle">
      {{ invalid === "incomplete" ? "This link is incomplete" : "Studio can't read this design system" }}
    </h1>
    <p :class="s.invalidBody">
      {{
        invalid === "incomplete"
          ? "Part of it was likely cut off when it was copied. Run this in your project for a fresh one."
          : "It may come from a different Panda version than this Studio. Update Panda and run this in your project again."
      }}
    </p>
    <div :class="s.command">
      <code><span :class="s.prompt">$</span> panda studio</code>
      <button type="button" :class="s.copy" @click="copyCommand">
        {{ copyLabel }}
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
