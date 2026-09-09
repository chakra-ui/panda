<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { buildThemeLayer, type Variant } from "~/utils/token-model";
import type { TokensFile } from "~/utils/tokens";
import { saveTokens, saveTokenCss } from "~/utils/idb";

const route = useRoute();
const slug = String(route.params.slug);

useHead({ title: "Shared system — Panda Spec Studio", meta: [{ name: "robots", content: "noindex" }] });

const STYLE_ID = "panda-spec-token-vars";
const resolveVars = ref(false);
const variants = ref<Variant[]>([]);

const { data } = await useFetch<{ tokens: TokensFile; css: string | null; usage: unknown }>(
  `/api/specs/${slug}`,
);
if (!data.value?.tokens) throw createError({ statusCode: 404, statusMessage: "Spec not found" });

const analyzeHref = `/a/${slug}`;

onMounted(async () => {
  const css = data.value?.css ?? null;
  if (data.value?.tokens) await saveTokens(JSON.stringify(data.value.tokens));
  await saveTokenCss(css);
  if (!css) return;
  const theme = buildThemeLayer(css);
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = theme.css;
  document.head.appendChild(el);
  resolveVars.value = true;
  variants.value = theme.variants;
});

onBeforeUnmount(() => document.getElementById(STYLE_ID)?.remove());

async function reset() {
  await navigateTo("/");
}
</script>

<template>
  <TokenView
    v-if="data?.tokens"
    :file="data.tokens"
    :resolve-vars="resolveVars"
    :variants="variants"
    :usage="data.usage"
    :analyze-href="analyzeHref"
    @reset="reset"
  />
</template>
