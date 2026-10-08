<script setup lang="ts">
import { ref } from 'vue'
import * as s from './view.styles'
import { button } from 'styled-system/recipes'
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

const copied = ref(false)

async function copyCommand() {
  await navigator.clipboard.writeText('panda studio')
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

async function reset() {
  await clearTokens()
  await navigateTo('/')
}
</script>

<template>
  <TokenView v-if="ready && ds" :ds="ds" :usage="usage" :analyze-href="'/analyze'" @reset="reset" />
  <div v-else-if="expired" :class="s.expired">
    <svg
      :class="s.expiredIcon"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
    <h1 :class="s.expiredTitle">This link has expired</h1>
    <p :class="s.expiredBody">
      Studio links open once and last ten minutes. Run this in your project for a fresh one.
    </p>
    <div :class="s.command">
      <code><span :class="s.prompt">$</span> panda studio</code>
      <button type="button" :class="s.copy" @click="copyCommand">{{ copied ? 'Copied' : 'Copy' }}</button>
    </div>
    <NuxtLink to="/" :class="button({ variant: 'outline' })">Load a file instead</NuxtLink>
  </div>
  <div v-else :class="s.loading">
    <img src="/panda.svg" alt="" :class="s.loadingLogo" />
    <span :class="s.loadingSpinner" />
    Loading your system…
  </div>
</template>
