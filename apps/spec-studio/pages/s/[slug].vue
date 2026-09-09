<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as s from "../view.styles";
import { decodeSpec } from "~/utils/share";
import { buildThemeLayer, type Variant } from "~/utils/token-model";
import type { TokensFile } from "~/utils/tokens";

const route = useRoute();
const slug = String(route.params.slug);

useHead({ title: "Shared system — Panda Spec Studio", meta: [{ name: "robots", content: "noindex" }] });

const STYLE_ID = "panda-spec-token-vars";
const file = ref<TokensFile | null>(null);
const resolveVars = ref(false);
const variants = ref<Variant[]>([]);
const error = ref(false);

const { data } = await useFetch<{ code: string }>(`/api/specs/${slug}`);

onMounted(async () => {
  if (!data.value?.code) {
    error.value = true;
    return;
  }
  try {
    const payload = await decodeSpec(data.value.code);
    file.value = payload.tokens;
    if (payload.css) {
      const theme = buildThemeLayer(payload.css);
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = theme.css;
      document.head.appendChild(el);
      resolveVars.value = true;
      variants.value = theme.variants;
    }
  } catch {
    error.value = true;
  }
});

onBeforeUnmount(() => document.getElementById(STYLE_ID)?.remove());

async function reset() {
  await navigateTo("/");
}
</script>

<template>
  <TokenView
    v-if="file"
    :file="file"
    :resolve-vars="resolveVars"
    :variants="variants"
    @reset="reset"
  />
  <p v-else :class="s.loading">
    {{ error ? "That shared system could not be found." : "Loading shared system…" }}
  </p>
</template>
