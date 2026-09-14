<script setup lang="ts">
import { computed } from "vue";
import { index, type DesignSystemSpec } from "~/utils/design-system";
import { saveTokens } from "~/utils/idb";

const route = useRoute();
const slug = String(route.params.slug);

useHead({ title: "Shared system — Panda Studio", meta: [{ name: "robots", content: "noindex" }] });

const { data } = await useFetch<{ spec: DesignSystemSpec; usage: unknown }>(`/api/specs/${slug}`);
if (!data.value?.spec) throw createError({ statusCode: 404, statusMessage: "Spec not found" });

const ds = computed(() => index(data.value!.spec));
const analyzeHref = `/a/${slug}`;

onMounted(async () => {
  if (data.value?.spec) await saveTokens(JSON.stringify(data.value.spec));
});

async function reset() {
  await navigateTo("/");
}
</script>

<template>
  <TokenView :ds="ds" :usage="data?.usage" :analyze-href="analyzeHref" @reset="reset" />
</template>
