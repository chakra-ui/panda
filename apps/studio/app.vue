<script setup lang="ts">
import { Toast, Toaster } from '@ark-ui/vue/toast'
import * as s from './app.css'
import { toaster } from '~/utils/toaster'
import { linkLoading } from '~/utils/spec-link-state'

const route = useRoute()
</script>

<template>
  <a href="#content" :class="s.skipLink">Skip to content</a>
  <BusyOverlay v-if="linkLoading && route.path !== '/view'" :label="linkLoading" />
  <NuxtPage />
  <Toaster :toaster="toaster" v-slot="toast">
    <Toast.Root :class="s.toast" :data-type="toast.type">
      <Toast.Title>{{ toast.title }}</Toast.Title>
    </Toast.Root>
  </Toaster>
</template>
