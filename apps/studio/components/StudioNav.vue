<script setup lang="ts">
import * as s from './StudioNav.css'

const route = useRoute()

const links = [
  { to: '/view', label: 'Tokens' },
  { to: '/analyze', label: 'Usage' },
] as const
</script>

<template>
  <nav :class="s.nav" aria-label="Studio">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :class="s.link"
      :aria-current="route.path === link.to ? 'page' : undefined"
    >
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>
