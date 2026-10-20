<script setup lang="ts">
import { computed } from 'vue'
import * as s from './StudioNav.css'
import { useLiveStudio } from '~/composables/useLiveStudio'

const route = useRoute()
const { connected } = useLiveStudio()

const links = computed(() => [
  { path: '/view', to: '/view', label: 'Tokens' },
  { path: '/analyze', to: connected.value ? '/analyze?view=project' : '/analyze', label: 'Usage' },
])
</script>

<template>
  <nav :class="s.nav" aria-label="Studio">
    <NuxtLink
      v-for="link in links"
      :key="link.path"
      :to="link.to"
      :class="s.link"
      :aria-current="route.path === link.path ? 'page' : undefined"
    >
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>
