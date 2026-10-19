<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import * as s from './analyze.css'
import { button, frame, navItem } from 'styled-system/recipes'
import { index, parseSpec } from '~/utils/design-system'
import { loadTokens, saveUsage, loadUsage } from '~/utils/idb'
import type { CategoryUsage } from '~/utils/analyze'
import { droppedFiles } from '~/utils/dropped'
import { useAnalyze } from '~/composables/useAnalyze'

const {
  ds,
  report,
  scannedCount,
  empty,
  mode,
  analyzing,
  preciseFailed,
  preciseError,
  analyzeFiles,
  reset,
  dragging,
  busy,
  onPick,
  onDrop,
  onDragOver,
  onDragLeave,
} = useAnalyze()

useHead({
  title: 'Analyze usage — Panda Studio',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const classes = frame()
const route = useRoute()
const scopeCategory = computed(() => String(route.query.category ?? ''))
const scopedReport = computed(() => {
  if (!report.value) return []
  if (!scopeCategory.value) return report.value
  const scoped = report.value.filter((c) => c.type === scopeCategory.value)
  return scoped.length ? scoped : report.value
})

const noUsage = computed(() => !!report.value?.length && report.value.every((c) => c.used === 0))

const scopeItems = computed(() => [
  { label: 'All categories', value: '' },
  ...(report.value ?? []).map((c) => ({ label: c.type, value: c.type })),
])

async function onScope(v: string) {
  await navigateTo({ path: '/analyze', query: v ? { category: v } : {} })
}

const usageSnapshot = computed(() =>
  report.value ? { report: report.value, scannedCount: scannedCount.value, mode: mode.value } : null,
)
watch(usageSnapshot, (u) => saveUsage(u))

onMounted(async () => {
  const raw = await loadTokens()
  const result = raw ? parseSpec(raw) : null
  if (result?.ok) ds.value = index(result.spec)
  if (droppedFiles.value.length) {
    await analyzeFiles(droppedFiles.value)
    return
  }
  const saved = await loadUsage<{
    report: CategoryUsage[]
    scannedCount: number
    mode: 'heuristic' | 'precise'
  }>()
  if (saved?.report?.length) {
    report.value = saved.report
    scannedCount.value = saved.scannedCount ?? 0
    mode.value = saved.mode ?? 'heuristic'
  }
})
</script>

<template>
  <AppFrame>
    <template v-if="ds" #sidebar-header>
      <DesignSearch :ds="ds" />
    </template>

    <template #sidebar>
      <SidebarSection label="Studio">
        <NuxtLink v-if="ds" to="/view" :class="navItem()">Tokens</NuxtLink>
        <NuxtLink to="/analyze" :class="navItem()">Usage</NuxtLink>
        <NuxtLink to="/" :class="navItem()">Open another system</NuxtLink>
      </SidebarSection>
    </template>

    <template #header>
      <PageHeader
        title="Analyze usage"
        description="Find the tokens your code uses, the ones it never touches, and the ones it leans on most."
      >
        <template v-if="report" #actions>
          <SelectField label="Category" :items="scopeItems" :value="scopeCategory" @change="onScope" />
          <button type="button" :class="button()" @click="reset">Scan another folder</button>
        </template>
      </PageHeader>
    </template>

    <div v-if="busy || analyzing" :class="s.analyzing" role="status">
      <Spinner />
      {{ busy && !analyzing ? 'Reading your files…' : 'Analyzing your source…' }}
    </div>

    <template v-else-if="!report">
      <div :class="classes.root">
        <div
          :class="[classes.body, s.dropzone]"
          :data-dragging="dragging || undefined"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        >
          <span :class="s.dropIcon"><Icon name="folder" :size="16" /></span>
          <p v-if="ds" :class="s.dropTitle">Drop your app folder or the whole repo</p>
          <p v-else :class="s.dropTitle">Drop your source folder or the whole repo</p>
          <p :class="s.dropHint">
            {{
              ds
                ? 'Your tokens are loaded. Drop your source to scan it.'
                : 'Include your design-system.json to browse the tokens too.'
            }}
          </p>
          <label :class="[button({ variant: 'primary', size: 'md' }), s.dropAction]">
            Choose folder
            <input type="file" webkitdirectory multiple hidden @change="onPick" />
          </label>
        </div>
        <p :class="classes.bar">
          <Icon name="info" :size="13" />
          <span>
            Include <code>panda.config.ts</code> for exact results from the Panda compiler. Without it, Studio matches
            token names.
          </span>
        </p>
      </div>
      <p v-if="empty" role="alert" :class="s.notice">
        No source files found. Studio skips build output like <code>styled-system/</code>,
        <code>node_modules/</code> and <code>dist/</code>. Drop <code>app/</code>, <code>src/</code>, or the whole repo.
      </p>
    </template>

    <template v-else>
      <p :class="s.scanned">
        <span :class="s.badge" :data-precise="mode === 'precise' || undefined">
          {{ mode === 'precise' ? 'exact' : 'name match' }}
        </span>
        Scanned {{ scannedCount }} file{{ scannedCount === 1 ? '' : 's' }}
      </p>

      <p v-if="noUsage" role="alert" :class="s.notice">
        None of these tokens appear in {{ scannedCount }} file{{ scannedCount === 1 ? '' : 's' }}. They may belong to
        another project: run <code>panda codegen --spec</code> here and open that file. Studio supports Panda v2.
      </p>
      <p v-else-if="preciseFailed" :class="s.hint">
        Showing a name-match scan. The compiler couldn't read <code>panda.config</code
        ><template v-if="preciseError"
          >: <code>{{ preciseError }}</code></template
        >.
      </p>

      <AnalyzeReport :report="scopedReport" />
    </template>
  </AppFrame>
</template>
