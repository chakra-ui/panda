<script setup lang="ts">
import { onMounted } from "vue";
import { Toast, Toaster } from "@ark-ui/vue";
import * as s from "./app.styles";
import { useTheme } from "~/composables/useTheme";
import { toaster } from "~/utils/toaster";

const { theme, toggle, sync } = useTheme();
onMounted(sync);
</script>

<template>
  <div :class="s.shell">
    <header :class="s.header">
      <NuxtLink to="/" :class="s.brand">
        <span :class="s.brandBadge"><img src="/panda.svg" alt="" :class="s.brandLogo" /></span>
        <span :class="s.brandName">Spec Studio</span>
      </NuxtLink>
      <div :class="s.headerRight">
        <a href="https://panda-css.com" target="_blank" rel="noopener" :class="s.headerLink"
          >Built with Panda CSS ↗</a
        >
        <button
          type="button"
          :class="s.themeToggle"
          :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
          @click="toggle"
        >
          <svg
            v-if="theme === 'dark'"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
            />
          </svg>
          <svg
            v-else
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>
    </header>
    <div :class="s.rule" />
    <NuxtPage />
    <Toaster :toaster="toaster" v-slot="toast">
      <Toast.Root :class="[s.toast, toast.type === 'error' && s.toastError]">
        <Toast.Title>{{ toast.title }}</Toast.Title>
      </Toast.Root>
    </Toaster>
  </div>
</template>
