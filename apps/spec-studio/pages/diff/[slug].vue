<script setup lang="ts">
import { computed, ref } from "vue";
import * as s from "./[slug].styles";
import { decodeSpec } from "~/utils/share";
import { diffSpecs, type CategoryDiff } from "~/utils/diff";
import { isSemantic } from "~/utils/token-model";

const route = useRoute();
const slug = String(route.params.slug);

useHead({ title: "Changes — Panda Spec Studio", meta: [{ name: "robots", content: "noindex" }] });

const meta = ref<{ title: string | null; latest: number } | null>(null);
const diff = ref<CategoryDiff[] | null>(null);
const error = ref(false);

const head = await useFetch<{ title: string | null; latest: number }>(`/api/specs/${slug}`);
meta.value = head.data.value ?? null;

if (meta.value && meta.value.latest >= 2) {
  const [curr, prev] = await Promise.all([
    $fetch<{ code: string }>(`/api/specs/${slug}`),
    $fetch<{ code: string }>(`/api/specs/${slug}`, { query: { v: meta.value.latest - 1 } }),
  ]);
  try {
    const [a, b] = await Promise.all([decodeSpec(prev.code), decodeSpec(curr.code)]);
    diff.value = diffSpecs(a.tokens, b.tokens);
  } catch {
    error.value = true;
  }
}

const isColor = (type: string) => type === "colors" || type === "gradients";
const nothingChanged = computed(() => diff.value !== null && diff.value.length === 0);
</script>

<template>
  <div :class="s.page">
    <NuxtLink :to="`/s/${slug}`" :class="s.back">← back to system</NuxtLink>
    <h1 :class="s.title">{{ meta?.title || "Changes" }}</h1>

    <p v-if="error" :class="s.empty">Couldn't load these versions.</p>
    <p v-else-if="!meta" :class="s.empty">That system could not be found.</p>
    <p v-else-if="meta.latest < 2" :class="s.empty">Only one version so far — nothing to compare.</p>
    <template v-else>
      <p :class="s.sub">v{{ meta.latest - 1 }} → v{{ meta.latest }}</p>
      <p v-if="nothingChanged" :class="s.empty">No token changes between these versions.</p>

      <section v-for="c in diff ?? []" :key="c.type" :class="s.cat">
        <h2 :class="s.catHead">{{ c.type }}</h2>
        <div :class="s.rows">
          <div v-for="t in c.added" :key="`a-${t.name}`" :class="[s.row, s.added]">
            <span :class="[s.sign, s.addSign]">+</span>
            <span :class="s.nameCell">{{ t.name }}</span>
            <span :class="s.valCell">
              <span v-if="isColor(c.type)" :class="s.swatch" :style="{ background: t.value }" />{{ t.value }}
            </span>
          </div>
          <div v-for="t in c.changed" :key="`c-${t.name}`" :class="[s.row, s.changed]">
            <span :class="s.sign">~</span>
            <span :class="s.nameCell">{{ t.name }}</span>
            <span :class="s.valCell">
              <span v-if="isColor(c.type)" :class="s.swatch" :style="{ background: t.from }" />{{ t.from }}
              <span :class="s.arrow">→</span>
              <span v-if="isColor(c.type)" :class="s.swatch" :style="{ background: t.to }" />{{ t.to }}
            </span>
          </div>
          <div v-for="t in c.removed" :key="`r-${t.name}`" :class="[s.row, s.removed]">
            <span :class="[s.sign, s.removeSign]">−</span>
            <span :class="s.nameCell">{{ t.name }}</span>
            <span :class="s.valCell">
              <span v-if="isColor(c.type)" :class="s.swatch" :style="{ background: t.value }" />{{ t.value }}
            </span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
