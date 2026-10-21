<script setup lang="ts">
import { computed, ref } from 'vue'
import { max } from 'd3-array'
import { scaleLinear, scaleSqrt } from 'd3-scale'
import type { RouteLocationRaw } from 'vue-router'
import * as s from './ScanOverview.css'
import type { DesignSystemIndex } from '~/utils/design-system'
import { orderCategories } from '~/utils/design-system'
import { summarizeScan, type Issue, type ProjectScan, type ScanSummary } from '~/utils/project-scan'

const props = defineProps<{
  ds: DesignSystemIndex
  scan: ProjectScan
  to: (path: string, line?: number) => RouteLocationRaw
}>()

const VALUE_LIMIT = 8
const CHIP_LIMIT = 60

const summary = computed(() => {
  const categories = orderCategories(
    props.ds.categories().map((type) => ({ type, count: props.ds.categoryPaths(type).length })),
  ).map((c) => c.type)
  return summarizeScan(props.scan, props.ds, categories)
})

const coverage = computed(() =>
  summary.value.total ? Math.round((summary.value.used / summary.value.total) * 100) : 0,
)

const shade = computed(() => {
  const most = max(summary.value.categories.flatMap((c) => c.tokens.map((t) => t.uses))) ?? 1
  return scaleSqrt()
    .domain([1, Math.max(most, 2)])
    .range([0.35, 1])
    .clamp(true)
})

const barWidth = computed(() =>
  scaleLinear()
    .domain([0, summary.value.top[0]?.uses ?? 1])
    .range([0, 100]),
)

const topGroups = computed(() => {
  const groups = new Map<string, { category: string; uses: number; tokens: ScanSummary['top'] }>()
  for (const t of summary.value.top) {
    const group = groups.get(t.category) ?? { category: t.category, uses: 0, tokens: [] }
    group.uses += t.uses
    group.tokens.push(t)
    groups.set(t.category, group)
  }
  return [...groups.values()].toSorted((a, b) => b.uses - a.uses)
})

const issueKind = ref<'all' | 'unknown' | 'raw'>('all')
const showAllValues = ref(false)

const issueValues = computed(() => {
  const groups = new Map<string, { kind: Issue['kind']; value: string; fix?: string; issues: ScanSummary['issues'] }>()
  for (const issue of summary.value.issues) {
    if (issueKind.value !== 'all' && issue.kind !== issueKind.value) continue
    const fix = issue.kind === 'unknown' ? issue.suggestion : issue.match
    const key = `${issue.kind}\0${issue.value}\0${fix ?? ''}`
    const group = groups.get(key) ?? { kind: issue.kind, value: issue.value, fix, issues: [] }
    group.issues.push(issue)
    groups.set(key, group)
  }
  return [...groups]
    .map(([key, group]) => ({ key, ...group, files: [...new Set(group.issues.map((i) => i.file))] }))
    .toSorted(
      (a, b) =>
        Number(b.kind === 'unknown') - Number(a.kind === 'unknown') ||
        b.issues.length - a.issues.length ||
        a.value.localeCompare(b.value),
    )
})

const shownValues = computed(() => (showAllValues.value ? issueValues.value : issueValues.value.slice(0, VALUE_LIMIT)))

const fileName = (path: string) => path.split('/').pop() ?? path

const swatch = (category: string, name: string) =>
  category === 'colors' || category === 'gradients' ? props.ds.resolve(`${category}.${name}`)?.value : undefined

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
</script>

<template>
  <div :class="s.root">
    <StatGrid
      :items="[
        { label: 'Tokens used', value: summary.used, total: summary.total },
        { label: 'Coverage', value: `${coverage}%` },
        { label: 'Unknown', value: summary.unknown, tone: summary.unknown ? 'danger' : undefined },
        { label: 'Hard-coded', value: summary.raw, tone: summary.raw ? 'warning' : undefined },
      ]"
    />

    <section :class="s.section">
      <header :class="s.sectionHeader">
        <h2 :class="s.heading">Token coverage</h2>
        <span :class="s.legend">
          <i :class="s.cell" aria-hidden="true" /> Unused
          <i :class="s.cell" data-used style="opacity: 0.4" aria-hidden="true" />
          <i :class="s.cell" data-used aria-hidden="true" /> Used more
        </span>
      </header>
      <div :class="s.waffle">
        <details v-for="c in summary.categories" :key="c.type" :class="s.category">
          <summary :class="s.categoryRow">
            <span :class="s.categoryName">{{ c.type }}</span>
            <span :class="s.cells" :aria-label="`${c.used} of ${c.tokens.length} ${c.type} used`" role="img">
              <i
                v-for="t in c.tokens"
                :key="t.name"
                :class="s.cell"
                :data-used="t.uses ? '' : undefined"
                :style="t.uses ? { opacity: shade(t.uses) } : undefined"
                :title="`${t.name} · ${plural(t.uses, 'use')}`"
              />
            </span>
            <span :class="s.categoryCount">{{ c.used }}/{{ c.tokens.length }}</span>
          </summary>
          <div :class="s.unused">
            <template v-if="c.used < c.tokens.length">
              <span :class="s.unusedLabel">Never used</span>
              <code v-for="t in c.tokens.filter((t) => !t.uses).slice(0, CHIP_LIMIT)" :key="t.name" :class="s.chip">
                {{ t.name }}
              </code>
              <span v-if="c.tokens.length - c.used > CHIP_LIMIT" :class="s.unusedLabel">
                and {{ c.tokens.length - c.used - CHIP_LIMIT }} more
              </span>
            </template>
            <span v-else :class="s.unusedLabel">All {{ c.tokens.length }} {{ c.type }} are used.</span>
          </div>
        </details>
      </div>
    </section>

    <div :class="s.columns">
      <section :class="s.section">
        <h2 :class="s.heading">Most used tokens</h2>
        <p v-if="!summary.top.length" :class="s.empty">None of these files use a token yet.</p>
        <div :class="s.groups">
          <div v-for="g in topGroups" :key="g.category" :class="s.group">
            <h3 :class="s.groupHeading">
              {{ g.category }} <span :class="s.groupCount">{{ plural(g.uses, 'use') }}</span>
            </h3>
            <ol :class="s.bars">
              <li v-for="t in g.tokens" :key="t.path" :class="s.bar" :title="`${t.path} · ${plural(t.uses, 'use')}`">
                <i :class="s.barFill" :style="{ width: `${barWidth(t.uses)}%` }" aria-hidden="true" />
                <i
                  v-if="swatch(t.category, t.name)"
                  :class="s.swatch"
                  :style="{ background: swatch(t.category, t.name) }"
                  aria-hidden="true"
                />
                <code :class="s.barLabel">{{ t.name }}</code>
                <span :class="s.barValue">{{ t.uses }}</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section :class="s.section">
        <header :class="s.sectionHeader">
          <h2 :class="s.heading">Issues</h2>
          <div v-if="summary.issues.length" :class="s.filter" role="group" aria-label="Show issues">
            <button
              v-for="option in [
                { kind: 'all', label: 'All', count: summary.issues.length },
                { kind: 'unknown', label: 'Unknown', count: summary.unknown },
                { kind: 'raw', label: 'Hard-coded', count: summary.raw },
              ] as const"
              :key="option.kind"
              type="button"
              :class="s.filterOption"
              :aria-pressed="issueKind === option.kind"
              :disabled="!option.count"
              @click="issueKind = option.kind"
            >
              {{ option.label }} <span :class="s.filterCount">{{ option.count }}</span>
            </button>
          </div>
        </header>
        <p v-if="!summary.issues.length" :class="s.empty">No issues. Every value comes from your tokens.</p>
        <ul :class="s.values">
          <li v-for="group in shownValues" :key="group.key">
            <details :class="s.value">
              <summary :class="s.valueRow">
                <span :class="s.dot" :data-tone="group.kind === 'unknown' ? 'danger' : 'warning'" aria-hidden="true" />
                <span :class="s.srOnly">{{ group.kind === 'unknown' ? 'Not in your system' : 'Hard-coded' }}:</span>
                <code :class="s.issueValue">{{ group.value }}</code>
                <span :class="s.valueMeta">
                  {{ plural(group.issues.length, 'use') }} ·
                  {{ group.files.length === 1 ? fileName(group.files[0]) : plural(group.files.length, 'file') }}
                </span>
                <code v-if="group.fix" :class="s.issueFix">→ {{ group.fix }}</code>
                <Icon name="chevronRight" :size="12" :class="s.chevron" />
              </summary>
              <ul :class="s.locations">
                <li v-for="(issue, i) in group.issues" :key="i">
                  <NuxtLink :to="to(issue.file, issue.line)" :class="s.location" :title="issue.file">
                    <span :class="s.locationFile">
                      {{ issue.file
                      }}<span :class="s.locationLine"><span :class="s.srOnly"> line</span>:{{ issue.line }}</span>
                    </span>
                    <span :class="s.locationProp">{{ issue.prop }}</span>
                  </NuxtLink>
                </li>
              </ul>
            </details>
          </li>
        </ul>
        <button
          v-if="issueValues.length > VALUE_LIMIT && !showAllValues"
          type="button"
          :class="s.more"
          @click="showAllValues = true"
        >
          Show {{ issueValues.length - VALUE_LIMIT }} more values
        </button>
      </section>
    </div>
  </div>
</template>
