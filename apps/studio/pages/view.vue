<script setup lang="ts">
import { ref } from 'vue'
import { index, parseSpec, type DesignSystemIndex } from '~/utils/design-system'
import { loadTokens } from '~/utils/idb'
import { linkPending } from '~/utils/spec-link-state'

useHead({
  title: 'Your system — Panda Studio',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const ds = ref<DesignSystemIndex | null>(null)
const ready = ref(false)

onMounted(async () => {
  if (linkPending.value && !(await linkPending.value)) return
  const raw = await loadTokens()
  const result = raw ? parseSpec(raw) : null
  if (!result?.ok) {
    await navigateTo('/')
    return
  }
  ds.value = index(result.spec)
  ready.value = true
})
</script>

<template>
  <TokenView v-if="ready && ds" :ds="ds" />
  <ViewSkeleton v-else />
</template>
