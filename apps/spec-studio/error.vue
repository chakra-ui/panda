<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import * as s from "./error.styles";
import * as app from "./app.styles";

const props = defineProps<{ error: { statusCode?: number; message?: string; url?: string } }>();

const code = props.error?.statusCode ?? 404;
const isNotFound = code === 404;

const clientPath = ref("");
onMounted(() => {
  clientPath.value = window.location.pathname;
});
const path = computed(() => props.error?.url || clientPath.value);

const headline = computed(() =>
  isNotFound ? "This route isn't in the spec." : "Something didn't render.",
);
const detail = computed(() => (isNotFound ? path.value : props.error?.message || ""));

useHead({ title: `${code} · Panda Spec Studio` });

function goHome() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <div :class="s.wrap">
    <div :class="s.glow" aria-hidden="true" />
    <div :class="s.content">
      <NuxtLink to="/" :class="[app.brand, s.brand]">
        <span :class="app.brandBadge"><img src="/panda.svg" alt="" :class="app.brandLogo" /></span>
        <span :class="app.brandName">Spec Studio</span>
      </NuxtLink>
      <p :class="s.code">{{ code }}</p>
      <p :class="s.message">{{ headline }}</p>
      <p v-if="detail" :class="s.detail">{{ detail }}</p>
      <button type="button" :class="s.button" @click="goHome">Back to the studio</button>
    </div>
  </div>
</template>
