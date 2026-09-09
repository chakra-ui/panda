<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as s from "./view.styles";
import { parseTokens, type TokensFile } from "~/utils/tokens";
import { buildThemeLayer, type Variant } from "~/utils/token-model";
import { loadTokens, loadTokenCss, clearTokens } from "~/utils/idb";

useHead({
  title: "Your system — Panda Spec Studio",
  meta: [{ name: "robots", content: "noindex" }],
});

const STYLE_ID = "panda-spec-token-vars";
const file = ref<TokensFile | null>(null);
const ready = ref(false);
const resolveVars = ref(false);
const variants = ref<Variant[]>([]);

onMounted(async () => {
  const raw = await loadTokens();
  const result = raw ? parseTokens(raw) : null;
  if (!result?.ok) {
    await navigateTo("/");
    return;
  }
  file.value = result.file;
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
    @reset="reset"
  />
  <p v-else :class="s.loading">Loading your system…</p>
</template>
