<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as s from './AppFrame.css'
import { useScrollEdges } from '~/composables/useScrollEdges'

withDefaults(defineProps<{ width?: 'narrow' | 'wide' }>(), { width: 'narrow' })

const route = useRoute()

const sidebarBody = ref<HTMLElement | null>(null)
const edges = useScrollEdges(sidebarBody)

const menuOpen = ref(false)
const isMobile = ref(false)

watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)
watch(menuOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
})

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') menuOpen.value = false
}

let media: MediaQueryList | undefined
const syncMedia = () => {
  isMobile.value = !!media?.matches
  if (!isMobile.value) menuOpen.value = false
}

onMounted(() => {
  media = matchMedia('(max-width: 767.98px)')
  media.addEventListener('change', syncMedia)
  syncMedia()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  media?.removeEventListener('change', syncMedia)
  window.removeEventListener('keydown', onKeydown)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <div :class="s.frame">
    <header :class="s.mobileBar">
      <NuxtLink to="/" :class="s.brand" aria-label="Panda Studio home">
        <StudioLogo />
      </NuxtLink>
      <LiveStatus :class="s.live" />
      <button
        type="button"
        :class="s.menuButton"
        aria-controls="studio-sidebar"
        :aria-expanded="menuOpen"
        @click="menuOpen = true"
      >
        <Icon name="menu" :size="15" />
        Menu
      </button>
    </header>

    <div v-if="menuOpen" :class="s.backdrop" aria-hidden="true" @click="menuOpen = false" />

    <aside
      id="studio-sidebar"
      :class="s.sidebar"
      :data-open="menuOpen || undefined"
      :inert="isMobile && !menuOpen"
      :aria-label="isMobile ? 'Menu' : undefined"
    >
      <span :class="s.handle" aria-hidden="true" />
      <div :class="s.sidebarTop">
        <NuxtLink to="/" :class="s.brand" aria-label="Panda Studio home">
          <StudioLogo />
        </NuxtLink>
        <LiveStatus :class="s.live" />
        <button type="button" :class="s.closeButton" aria-label="Close menu" @click="menuOpen = false">
          <Icon name="close" :size="15" />
        </button>
      </div>

      <div v-if="$slots['sidebar-header']" :class="s.sidebarHeader">
        <slot name="sidebar-header" />
      </div>

      <div
        ref="sidebarBody"
        :class="s.sidebarBody"
        :data-fade-top="edges.top.value || undefined"
        :data-fade-bottom="edges.bottom.value || undefined"
      >
        <slot name="sidebar" />
      </div>

      <footer :class="s.sidebarFoot">
        <a href="https://panda-css.com/docs" target="_blank" rel="noopener" :class="s.docsLink">
          Panda CSS
          <Icon name="arrowUpRight" :size="12" />
        </a>
        <ThemeSwitch />
      </footer>
    </aside>

    <main id="content" :class="s.panel" :data-topbar="$slots.topbar ? '' : undefined">
      <div v-if="$slots.topbar" :class="s.topbar">
        <slot name="topbar" />
      </div>
      <div v-if="$slots.header" :class="s.header">
        <div :class="[s.content, s.headerContent]" :data-width="width">
          <slot name="header" />
        </div>
      </div>
      <div :class="[s.content, s.bodyContent]" :data-width="width">
        <slot />
      </div>
    </main>
  </div>
</template>
