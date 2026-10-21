<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLiveStudio } from '~/composables/useLiveStudio'
import { index, parseSpec, type DesignSystemIndex } from '~/utils/design-system'
import { loadTokens } from '~/utils/idb'
import { linkPending } from '~/utils/spec-link-state'

useHead({
  title: 'Your system — Panda Studio',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const live = useLiveStudio()
const saved = ref<DesignSystemIndex | null>(null)
const ready = ref(false)
const ds = computed(() => live.ds.value ?? saved.value)

onMounted(async () => {
  await live.settled()
  if (live.connected.value) {
    ready.value = true
    return
  }
  if (linkPending.value && !(await linkPending.value)) return
  const raw = await loadTokens()
  const result = raw ? parseSpec(raw) : null
  if (!result?.ok) {
    await navigateTo('/')
    return
  }
  saved.value = index(result.spec)
  ready.value = true
})
</script>

<template>
  <TokenView v-if="ready && ds" :ds="ds" />
  <ViewSkeleton v-else />
</template>
