<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Tabs } from '@ark-ui/vue/tabs'
import * as s from './UsagePanel.css'
import type { DesignSystemIndex } from '~/utils/design-system'
import type { Finding } from '~/utils/token-inspection'

type Change = { from: number; to: number; insert: string }

const props = defineProps<{
  ds: DesignSystemIndex
  findings: Finding[]
  readOnly?: boolean
  emptyText?: string
}>()
const emit = defineEmits<{ fix: [changes: Change[]]; reveal: [from: number, to: number] }>()

type Issue = Exclude<Finding, { kind: 'token' }> & { tone: 'danger' | 'warning'; label: string; replacement?: string }

const issues = computed(() =>
  props.findings.flatMap((f): Issue[] => {
    if (f.kind === 'unknown') return [{ ...f, tone: 'danger', label: 'Not in your system', replacement: f.suggestion }]
    if (f.kind === 'raw') return [{ ...f, tone: 'warning', label: 'Hard-coded', replacement: f.match }]
    return []
  }),
)

const unknownCount = computed(() => issues.value.filter((i) => i.kind === 'unknown').length)
const rawCount = computed(() => issues.value.length - unknownCount.value)

const fixes = computed(() =>
  issues.value.flatMap((i) => (i.replacement ? [{ from: i.from, to: i.to, insert: i.replacement }] : [])),
)

const used = computed(() => {
  const byPath = new Map<string, { path: string; category: string; name: string; uses: number; first: Finding }>()
  for (const finding of props.findings) {
    if (finding.kind !== 'token') continue
    const entry = byPath.get(finding.path)
    if (entry) {
      entry.uses++
      continue
    }
    const dot = finding.path.indexOf('.')
    byPath.set(finding.path, {
      path: finding.path,
      category: finding.path.slice(0, dot),
      name: finding.path.slice(dot + 1),
      uses: 1,
      first: finding,
    })
  }
  return [...byPath.values()].toSorted((a, b) => b.uses - a.uses || a.path.localeCompare(b.path))
})

const tab = ref(issues.value.length ? 'issues' : 'used')
watch(
  () => issues.value.length,
  (count, previous) => {
    if (count && !previous) tab.value = 'issues'
    if (!count && tab.value === 'issues' && used.value.length) tab.value = 'used'
  },
)

const swatch = (category: string, name: string) =>
  category === 'colors' || category === 'gradients' ? props.ds.resolve(`${category}.${name}`)?.value : undefined
</script>

<template>
  <aside :class="s.panel" aria-label="Usage">
    <StatGrid
      :items="[
        { label: 'Tokens', value: used.length },
        { label: 'Unknown', value: unknownCount, tone: unknownCount ? 'danger' : undefined },
        { label: 'Hard-coded', value: rawCount, tone: rawCount ? 'warning' : undefined },
      ]"
    />

    <p v-if="!findings.length" :class="s.empty">
      {{ emptyText ?? 'Write a style object to see which tokens it uses.' }}
    </p>

    <Tabs.Root v-else v-model="tab" :class="s.tabs">
      <Tabs.List :class="s.tabList" aria-label="Findings">
        <Tabs.Trigger value="issues" :class="s.tab">
          Issues <span :class="s.tabCount">{{ issues.length }}</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="used" :class="s.tab">
          Used <span :class="s.tabCount">{{ used.length }}</span>
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="issues" :class="s.content">
        <p v-if="!issues.length" :class="s.empty">No issues. Every value comes from your tokens.</p>
        <button v-if="!readOnly && fixes.length > 1" type="button" :class="s.fixAll" @click="emit('fix', fixes)">
          Fix all {{ fixes.length }}
        </button>
        <ul v-if="issues.length" :class="s.list">
          <li v-for="(issue, i) in issues" :key="`${i}:${issue.line}:${issue.from}`" :class="s.row">
            <button
              type="button"
              :class="s.target"
              :title="`${issue.label} · ${issue.prop} · line ${issue.line}`"
              :disabled="issue.from < 0"
              @click="emit('reveal', issue.from, issue.to)"
            >
              <span :class="s.dot" :data-tone="issue.tone" aria-hidden="true" />
              <span :class="s.srOnly">{{ issue.label }}:</span>
              <span v-if="readOnly" :class="s.line"><span :class="s.srOnly">line</span> {{ issue.line }}</span>
              <code :class="s.value">{{ issue.value }}</code>
              <span :class="s.meta">{{ issue.prop }}</span>
            </button>
            <span v-if="readOnly && issue.replacement" :class="s.aside">→ {{ issue.replacement }}</span>
            <button
              v-else-if="issue.replacement"
              type="button"
              :class="s.fix"
              :aria-label="`Replace ${issue.value} with ${issue.replacement}`"
              @click="emit('fix', [{ from: issue.from, to: issue.to, insert: issue.replacement }])"
            >
              → {{ issue.replacement }}
            </button>
          </li>
        </ul>
      </Tabs.Content>

      <Tabs.Content value="used" :class="s.content">
        <p v-if="!used.length" :class="s.empty">No tokens yet.</p>
        <ul v-else :class="s.list">
          <li v-for="token in used" :key="token.path" :class="s.row">
            <button
              type="button"
              :class="s.target"
              :title="`${token.path} · first used on line ${token.first.line}`"
              :disabled="token.first.from < 0"
              @click="emit('reveal', token.first.from, token.first.to)"
            >
              <span
                v-if="swatch(token.category, token.name)"
                :class="s.swatch"
                :style="{ background: swatch(token.category, token.name) }"
                aria-hidden="true"
              />
              <span v-else :class="s.dot" aria-hidden="true" />
              <code :class="s.value">{{ token.name }}</code>
              <span :class="s.meta">{{ token.category }}</span>
            </button>
            <span :class="s.aside">×{{ token.uses }}</span>
          </li>
        </ul>
      </Tabs.Content>
    </Tabs.Root>
  </aside>
</template>
