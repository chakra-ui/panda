<script setup lang="ts">
import { ref } from 'vue'
import * as s from './view.styles'
import { index, parseSpec, type DesignSystemIndex } from '~/utils/design-system'
import { loadTokens, loadUsage, saveUsage, saveTokens, clearTokens } from '~/utils/idb'
import { readHandoff, receiveHandoff } from '~/utils/handoff'
import { droppedFiles } from '~/utils/dropped'
import { useAnalyze } from '~/composables/useAnalyze'

useHead({
  title: 'Your system — Panda Studio',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const ds = ref<DesignSystemIndex | null>(null)
const ready = ref(false)
const usage = ref<unknown>(null)
const expired = ref(false)

const analyze = useAnalyze()

onMounted(async () => {
  const handoff = readHandoff(window.location)
  let handedOff: DesignSystemIndex | null = null
  if (handoff) {
    const received = handoff.key ? await receiveHandoff(handoff.id, handoff.key) : null
    history.replaceState(history.state, '', '/view')
    const parsed = received ? parseSpec(received) : null
    if (!received || !parsed?.ok) {
      expired.value = true
      return
    }
    handedOff = index(parsed.spec)
    try {
      await clearTokens()
      await saveTokens(received)
    } catch {}
  }

  if (handedOff) {
    ds.value = handedOff
  } else {
    const raw = await loadTokens()
    const result = raw ? parseSpec(raw) : null
    if (!result?.ok) {
      await navigateTo('/')
      return
    }
    ds.value = index(result.spec)
  }
  usage.value = await loadUsage()
  ready.value = true

  if (!usage.value && droppedFiles.value.length) {
    analyze.ds.value = ds.value
    await analyze.analyzeFiles(droppedFiles.value)
    if (analyze.report.value) {
      const snapshot = {
        report: analyze.report.value,
        scannedCount: analyze.scannedCount.value,
        mode: analyze.mode.value,
      }
      await saveUsage(snapshot)
      usage.value = snapshot
    }
  }
})

async function reset() {
  await clearTokens()
  await navigateTo('/')
}
</script>

<template>
  <TokenView v-if="ready && ds" :ds="ds" :usage="usage" :analyze-href="'/analyze'" @reset="reset" />
  <div v-else-if="expired" :class="s.loading">This link has expired. Run <code>panda studio</code> again.</div>
  <div v-else :class="s.loading">
    <img src="/panda.svg" alt="" :class="s.loadingLogo" />
    <span :class="s.loadingSpinner" />
    Loading your system…
  </div>
</template>
