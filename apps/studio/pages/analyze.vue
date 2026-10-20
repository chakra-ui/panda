<script setup lang="ts">
import { computed, onMounted, shallowRef, ref } from 'vue'
import * as s from './analyze.css'
import { button, navItem } from 'styled-system/recipes'
import { index, parseSpec, type DesignSystemIndex } from '~/utils/design-system'
import { loadTokens } from '~/utils/idb'
import { droppedFiles } from '~/utils/dropped'
import { useProjectScan } from '~/composables/useProjectScan'

useHead({
  title: 'Usage — Panda Studio',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const route = useRoute()
const router = useRouter()

const ds = shallowRef<DesignSystemIndex | null>(null)
const ready = ref(false)
const scanner = useProjectScan(ds)

const query = (key: string) => (typeof route.query[key] === 'string' ? (route.query[key] as string) : undefined)

const view = computed(() => (query('view') === 'project' || (ready.value && !ds.value) ? 'project' : 'playground'))
const file = computed(() => scanner.scan.value?.files.find((f) => f.path === query('file')))
const line = computed(() => Number(query('line')) || undefined)

const projectLink = { query: { view: 'project' } }
const fileLink = (path: string, at?: number) => ({ query: { view: 'project', file: path, line: at } })

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function timeAgo(at: number) {
  const minutes = Math.round((Date.now() - at) / 60_000)
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (minutes < 60) return format.format(-minutes, 'minute')
  if (minutes < 60 * 24) return format.format(-Math.round(minutes / 60), 'hour')
  return format.format(-Math.round(minutes / 1440), 'day')
}

const header = computed(() => {
  if (view.value === 'playground') {
    return { title: 'Playground', description: 'Write styles and see which tokens they use as you type.' }
  }
  if (file.value) {
    const parts = file.value.path.split('/')
    const issues = file.value.findings.filter((f) => f.kind !== 'token').length
    return {
      title: parts.at(-1) ?? file.value.path,
      description: `${parts.slice(0, -1).join('/') || 'Project root'} · ${plural(issues, 'issue')}`,
    }
  }
  const scan = scanner.scan.value
  if (!scan) {
    return { title: 'Project scan', description: 'See which tokens your project uses, and where it strays from them.' }
  }
  const source = scan.origin === 'report' ? 'From panda analyze' : `${plural(scan.sourceCount, 'file')} scanned`
  return {
    title: 'Project scan',
    description: `${source} · ${plural(scan.files.length, 'file')} with Panda styles · ${timeAgo(scan.scannedAt)}`,
  }
})

async function clear() {
  scanner.clear()
  await router.replace(projectLink)
}

onMounted(async () => {
  const raw = await loadTokens()
  const result = raw ? parseSpec(raw) : null
  if (result?.ok) ds.value = index(result.spec)
  ready.value = true
  if (droppedFiles.value.length) {
    const files = droppedFiles.value
    droppedFiles.value = []
    await router.replace(projectLink)
    await scanner.scanFiles(files)
  }
})
</script>

<template>
  <AppFrame width="wide">
    <template #sidebar-header>
      <StudioNav />
    </template>

    <template #sidebar>
      <SidebarSection>
        <NuxtLink
          :to="{ query: {} }"
          :class="[navItem(), s.mode]"
          :aria-current="view === 'playground' ? 'page' : undefined"
        >
          <Icon name="code" :size="14" />
          Playground
        </NuxtLink>
        <NuxtLink
          :to="projectLink"
          :class="[navItem(), s.mode]"
          :aria-current="view === 'project' && !file ? 'page' : undefined"
        >
          <Icon name="folder" :size="14" />
          Project scan
        </NuxtLink>
      </SidebarSection>

      <SidebarSection v-if="scanner.scan.value?.files.length" :label="`Files · ${scanner.scan.value.files.length}`">
        <FileTree :files="scanner.scan.value.files" :active="file?.path" :to="(path) => fileLink(path)" />
      </SidebarSection>
    </template>

    <template #header>
      <PageHeader :title="header.title" :description="header.description">
        <template v-if="view === 'project' && !file && scanner.scan.value && scanner.status.value === 'idle'" #actions>
          <button v-if="scanner.folder.value" type="button" :class="button({ variant: 'ghost' })" @click="scanner.rescan">
            Rescan
          </button>
          <button type="button" :class="button()" @click="clear"><Icon name="folder" :size="14" /> New scan</button>
        </template>
      </PageHeader>
    </template>

    <template v-if="ready">
      <template v-if="view === 'playground'">
        <UsagePlayground v-if="ds" :ds="ds" />
      </template>

      <template v-else>
        <ScanFileView v-if="ds && file" :ds="ds" :file="file" :line="line" :scanner="scanner" />
        <ScanOverview
          v-else-if="ds && scanner.scan.value && scanner.status.value === 'idle'"
          :ds="ds"
          :scan="scanner.scan.value"
          :to="fileLink"
        />
        <ProjectScan v-else :scanner="scanner" />
      </template>
    </template>
  </AppFrame>
</template>
